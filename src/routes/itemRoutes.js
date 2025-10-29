const Router = require('koa-router');

class ItemRoutes {
  constructor(itemController) {
    this.controller = itemController;
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/api/items/statistics', (ctx) => this.controller.getStatistics(ctx));
    
    this.router.get('/api/items', (ctx) => this.controller.getAllItems(ctx));
    
    this.router.get('/api/items/:id', (ctx) => this.controller.getItemById(ctx));
    
    this.router.post('/api/items', (ctx) => this.controller.createItem(ctx));
    
    this.router.put('/api/items/:id', (ctx) => this.controller.updateItem(ctx));
    
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




