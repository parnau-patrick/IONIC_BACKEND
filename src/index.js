require('dotenv').config();
const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const cors = require('@koa/cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const database = require('./config/database');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

const User = require('./models/User');
const Item = require('./models/item');

User.hasMany(Item, { foreignKey: 'userId', onDelete: 'CASCADE' });
Item.belongsTo(User, { foreignKey: 'userId' });

const ItemRepository = require('./repository/itemRepository');
const UserRepository = require('./repository/userRepository');

const ItemService = require('./service/itemService');
const AuthService = require('./service/authService');

const ItemController = require('./controller/itemController');
const AuthController = require('./controller/authController');

const ItemRoutes = require('./routes/itemRoutes');
const AuthRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 3000;

const app = new Koa();
const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });
app.use(cors({
  origin: '*',  
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-connection-id']
}));

const userConnections = new Map();

const broadcast = (data, excludeConnectionId = null) => {
  const { userId, event, payload } = data;
  
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId);
    const message = JSON.stringify({ event, payload });
    
    connections.forEach((ws, connectionId) => {
      if (connectionId !== excludeConnectionId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        console.log(`Broadcast to ${userId} (${connectionId}):`, event);
      }
    });
  }
};

const itemRepository = new ItemRepository();
const userRepository = new UserRepository();

const itemService = new ItemService(itemRepository);
const authService = new AuthService(userRepository);

const itemController = new ItemController(itemService, broadcast);
const authController = new AuthController(authService);

const itemRoutes = new ItemRoutes(itemController);
const authRoutes = new AuthRoutes(authController);

app.use(bodyparser());

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    ctx.status = error.status || 500;
    ctx.body = { 
      issue: [{ error: error.message || 'Internal server error' }]
    };
  }
});

app.use(async (ctx, next) => {
  const isProtected =
    ctx.path.startsWith('/api/items') ||
    ctx.path === '/api/auth/me';
  if (isProtected) {
    return authMiddleware(ctx, next);
  }
  return next();
});


app.use(authRoutes.getRoutes());
app.use(authRoutes.getAllowedMethods());
app.use(itemRoutes.getRoutes());
app.use(itemRoutes.getAllowedMethods());

app.use(async (ctx, next) => {
  if (ctx.path === '/health' && ctx.method === 'GET') {
    let totalConnections = 0;
    userConnections.forEach(connections => {
      totalConnections += connections.size;
    });
    
    ctx.body = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      connections: totalConnections
    };
  } else {
    await next();
  }
});


wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let userId = null;
  let connectionId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'auth' && data.token) {
        try {
          const decoded = jwt.verify(data.token, JWT_SECRET);
          userId = decoded.userId;
          connectionId = `${userId}-${Date.now()}-${Math.random()}`;
          
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Map());
          }
          userConnections.get(userId).set(connectionId, ws);
          
          ws.connectionId = connectionId;
          
          console.log(`User ${userId} authenticated via WebSocket (${connectionId})`);
          
          ws.send(JSON.stringify({
            event: 'authenticated',
            payload: { userId, connectionId }
          }));
        } catch (error) {
          console.error('WebSocket auth error:', error.message);
          ws.send(JSON.stringify({
            event: 'error',
            payload: { message: 'Invalid token' }
          }));
          ws.close();
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (userId && connectionId && userConnections.has(userId)) {
      userConnections.get(userId).delete(connectionId);
      
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
      }
      
      console.log(`User ${userId} disconnected from WebSocket (${connectionId})`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


const startServer = async () => {
  try {
    await database.connect();
    
    server.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('Server started successfully!');
      console.log(`HTTP Server: http://localhost:${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('Server closed');
  });
  
  await database.disconnect();

  console.log('Disconnected from database!');
  process.exit(0);
});

startServer();