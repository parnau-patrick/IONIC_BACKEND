require('dotenv').config();
const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
 const cors = require('@koa/cors');  // Dezactivat momentan
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Import config
const database = require('./config/database');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

// Import models (pentru relații)
const User = require('./models/User');
const Item = require('./models/item');

// Definim relația User-Item
User.hasMany(Item, { foreignKey: 'userId', onDelete: 'CASCADE' });
Item.belongsTo(User, { foreignKey: 'userId' });

// Import repositories
const ItemRepository = require('./repository/itemRepository');
const UserRepository = require('./repository/userRepository');

// Import services
const ItemService = require('./service/itemService');
const AuthService = require('./service/authService');

// Import controllers
const ItemController = require('./controller/itemController');
const AuthController = require('./controller/authController');

// Import routes
const ItemRoutes = require('./routes/itemRoutes');
const AuthRoutes = require('./routes/authRoutes');

// Configurare
const PORT = process.env.PORT || 3000;

// Create Koa app și server
const app = new Koa();
const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });
app.use(cors({
  origin: '*',  
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Map pentru conexiuni WebSocket: userId -> Set<WebSocket>
const userConnections = new Map();

// Funcție broadcast pentru WebSocket (trimite doar la user-ul specificat)
const broadcast = (data) => {
  const { userId, event, payload } = data;
  
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId);
    const message = JSON.stringify({ event, payload });
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
};

// Inițializare repositories
const itemRepository = new ItemRepository();
const userRepository = new UserRepository();

// Inițializare services
const itemService = new ItemService(itemRepository);
const authService = new AuthService(userRepository);

// Inițializare controllers
const itemController = new ItemController(itemService, broadcast);
const authController = new AuthController(authService);

// Inițializare routes
const itemRoutes = new ItemRoutes(itemController);
const authRoutes = new AuthRoutes(authController);

// ============= MIDDLEWARE =============

// Body parser
app.use(bodyparser());

// Request logging
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);
});

// Global error handler
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


// ============= ROUTES =============

// Auth routes (publice - nu necesită autentificare)
app.use(authRoutes.getRoutes());
app.use(authRoutes.getAllowedMethods());
app.use(itemRoutes.getRoutes());
app.use(itemRoutes.getAllowedMethods());

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.path === '/health' && ctx.method === 'GET') {
    ctx.body = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      connections: Array.from(userConnections.values()).reduce((sum, set) => sum + set.size, 0)
    };
  } else {
    await next();
  }
});

// ============= WEBSOCKET =============

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let userId = null;

  // Handler pentru mesaje
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Mesaj de autentificare
      if (data.type === 'auth' && data.token) {
        try {
          const decoded = jwt.verify(data.token, JWT_SECRET);
          userId = decoded.userId;
          
          // Adaugă conexiunea la Map
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
          }
          userConnections.get(userId).add(ws);
          
          console.log(`✅ User ${userId} authenticated via WebSocket`);
          
          // Trimite confirmare
          ws.send(JSON.stringify({
            event: 'authenticated',
            payload: { userId }
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

  // Handler pentru deconectare
  ws.on('close', () => {
    if (userId && userConnections.has(userId)) {
      userConnections.get(userId).delete(ws);
      
      // Curăță Set-ul gol
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
      }
      
      console.log(`❌ User ${userId} disconnected from WebSocket`);
    }
  });

  // Handler pentru erori
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============= START SERVER =============

const startServer = async () => {
  try {
    // Conectare la database
    await database.connect();
    
    // Start server
    server.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 Server started successfully!');
      console.log(`📡 HTTP Server: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  
  // Închide toate conexiunile WebSocket
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  // Închide serverul
  server.close(() => {
    console.log('✅ Server closed');
  });
  
  // Deconectare database
  await database.disconnect();
  
  console.log('👋 Goodbye!');
  process.exit(0);
});

// Start server
startServer();