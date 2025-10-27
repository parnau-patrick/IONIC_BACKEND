const Router = require('koa-router');

// Auth Routes pentru autentificare
class AuthRoutes {
  constructor(authController) {
    this.controller = authController;
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // POST /api/auth/register - înregistrare user nou
    this.router.post('/api/auth/register', (ctx) => this.controller.register(ctx));
    
    // POST /api/auth/login - login user
    this.router.post('/api/auth/login', (ctx) => this.controller.login(ctx));
    
    // GET /api/auth/me - obține user curent (necesită autentificare)
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