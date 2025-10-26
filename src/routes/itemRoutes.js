const Router = require('koa-router');

class ItemRoutes {
  constructor(itemController) {
    this.controller = itemController;
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/item', (ctx) => this.controller.getAllItems(ctx));
    this.router.get('/item/:id', (ctx) => this.controller.getItemById(ctx));
    this.router.post('/item', (ctx) => this.controller.createItem(ctx));
    this.router.put('/item/:id', (ctx) => this.controller.updateItem(ctx));
    this.router.del('/item/:id', (ctx) => this.controller.deleteItem(ctx));
  }

  getRoutes() {
    return this.router.routes();
  }

  getAllowedMethods() {
    return this.router.allowedMethods();
  }
}

module.exports = ItemRoutes;