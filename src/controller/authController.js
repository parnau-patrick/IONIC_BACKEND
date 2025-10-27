// Auth Controller pentru autentificare
class AuthController {
  constructor(authService) {
    this.service = authService;
  }

  // Register user nou
  async register(ctx) {
    try {
      const userData = ctx.request.body;
      const result = await this.service.register(userData);
      
      ctx.response.status = 201;
      ctx.response.body = result;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Login user
  async login(ctx) {
    try {
      const userData = ctx.request.body;
      const result = await this.service.login(userData);
      
      ctx.response.status = 200;
      ctx.response.body = result;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Get current user info
  async getMe(ctx) {
    try {
      const userId = ctx.state.user.id;
      const user = await this.service.getCurrentUser(userId);
      
      ctx.response.status = 200;
      ctx.response.body = { user };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Error handler
  handleError(ctx, error) {
    if (error.status) {
      ctx.response.status = error.status;
      ctx.response.body = { error: error.message };
    } else {
      console.error('Unexpected error:', error);
      ctx.response.status = 500;
      ctx.response.body = { error: 'Internal server error' };
    }
  }
}

module.exports = AuthController;