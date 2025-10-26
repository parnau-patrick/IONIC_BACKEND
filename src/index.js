const Koa = require('koa');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');
const WebSocket = require('ws');

const database = require('./config/database');
const ItemRepository = require('./repository/itemRepository');
const ItemService = require('./service/itemService');
const ItemController = require('./controller/itemController');
const ItemRoutes = require('./routes/itemRoutes');

const app = new Koa();
const server = require('http').createServer(app.callback());
const wss = new WebSocket.Server({ server });

const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const itemRepository = new ItemRepository();
const itemService = new ItemService(itemRepository);
const itemController = new ItemController(itemService, broadcast);
const itemRoutes = new ItemRoutes(itemController);

app.use(bodyparser());
app.use(cors());

app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error:', err);
    ctx.response.body = { issue: [{ error: err.message || 'Unexpected error' }] };
    ctx.response.status = err.status || 500;
  }
});

app.use(itemRoutes.getRoutes());
app.use(itemRoutes.getAllowedMethods());

const PORT = 3000;

async function startServer() {
  try {
    await database.connect();
    
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(` WebSocket available on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

wss.on('connection', (ws) => {
  console.log(' New WebSocket client connected');
  
  ws.on('close', () => {
    console.log(' WebSocket client disconnected');
  });
});

process.on('SIGINT', async () => {
  console.log('\n Shutting down server...');
  await database.disconnect();
  process.exit(0);
});