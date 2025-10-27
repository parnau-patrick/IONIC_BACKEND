const Router = require('koa-router');

// Item Routes - exact ca în proiectul original
class ItemRoutes {
  constructor(itemController) {
    this.controller = itemController;
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // GET /api/items - obține toate items (cu paginare, search, filter)
    this.router.get('/api/items', (ctx) => this.controller.getAllItems(ctx));
    
    // GET /api/items/:id - obține item după ID
    this.router.get('/api/items/:id', (ctx) => this.controller.getItemById(ctx));
    
    // POST /api/items - creează item nou
    this.router.post('/api/items', (ctx) => this.controller.createItem(ctx));
    
    // PUT /api/items/:id - update item
    this.router.put('/api/items/:id', (ctx) => this.controller.updateItem(ctx));
    
    // DELETE /api/items/:id - șterge item
    this.router.del('/api/items/:id', (ctx) => this.controller.deleteItem(ctx));
  }

  getRoutes() {
    return this.router.routes();
  }

  getAllowedMethods() {
    return this.router.allowedMethods();
  }
}

module.exports = ItemRoutes;