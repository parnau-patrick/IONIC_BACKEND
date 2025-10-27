class ItemController {
  constructor(itemService, broadcast) {
    this.service = itemService;
    this.broadcast = broadcast;
  }

  async getAllItems(ctx) {
    try {
      const userId = ctx.state.user.id;
      
      const page = parseInt(ctx.request.query.page) || 1;
      const limit = parseInt(ctx.request.query.limit) || 10;
      
      const searchText = ctx.request.query.text || null;
      const completed = ctx.request.query.completed !== undefined 
        ? ctx.request.query.completed === 'true' 
        : null;

      const result = await this.service.getAllItems(userId, searchText, completed, page, limit);
      
      ctx.response.status = 200;
      ctx.response.body = result;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async getItemById(ctx) {
    try {
      const userId = ctx.state.user.id;
      const id = ctx.params.id;
      
      const item = await this.service.getItemById(id, userId);
      
      ctx.response.status = 200;
      ctx.response.body = item;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async createItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const itemData = ctx.request.body;
      const connectionId = ctx.request.headers['x-connection-id']; // ← OBȚINE connectionId
      
      const newItem = await this.service.createItem(itemData, userId);
      
      ctx.response.status = 201;
      ctx.response.body = newItem;
      
      if (this.broadcast) {
        this.broadcast({
          event: 'created',
          userId,
          payload: { item: newItem }
        }, connectionId); 
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async updateItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const id = ctx.params.id;
      const itemData = ctx.request.body;
      const clientVersion = parseInt(ctx.request.get('ETag')) || itemData.version;
      const connectionId = ctx.request.headers['x-connection-id']; // ← OBȚINE connectionId
      
      const updatedItem = await this.service.updateItem(id, itemData, userId, clientVersion);
      
      ctx.response.status = 200;
      ctx.response.body = updatedItem;
      
      if (this.broadcast) {
        this.broadcast({
          event: 'updated',
          userId,
          payload: { item: updatedItem }
        }, connectionId);
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async deleteItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const id = ctx.params.id;
      const connectionId = ctx.request.headers['x-connection-id']; 
      
      const deletedItem = await this.service.deleteItem(id, userId);
      
      ctx.response.status = 200;
      ctx.response.body = { 
        message: 'Item deleted successfully',
        item: deletedItem 
      };
      
      if (this.broadcast) {
        this.broadcast({
          event: 'deleted',
          userId,
          payload: { item: deletedItem }
        }, connectionId); 
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  handleError(ctx, error) {
    if (error.status) {
      ctx.response.status = error.status;
      ctx.response.body = { issue: [{ error: error.message }] };
    } else {
      console.error('Unexpected error:', error);
      ctx.response.status = 500;
      ctx.response.body = { issue: [{ error: 'Internal server error' }] };
    }
  }
}

module.exports = ItemController;