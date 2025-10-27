const Router = require('koa-router');

class AuthRoutes {
  constructor(authController) {
    this.controller = authController;
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post('/api/auth/register', (ctx) => this.controller.register(ctx));
    
    this.router.post('/api/auth/login', (ctx) => this.controller.login(ctx));
    
    this.router.get('/api/auth/me', (ctx) => this.controller.getMe(ctx));
  }

  getRoutes() {
    return this.router.routes();
  }

  getAllowedMethods() {
    return this.router.allowedMethods();
  }
}

module.exports = AuthRoutes;