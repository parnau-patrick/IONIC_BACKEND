// Item Controller - exact ca în proiectul original dar cu userId din ctx.state.user
class ItemController {
  constructor(itemService, broadcast) {
    this.service = itemService;
    this.broadcast = broadcast;
  }

  // Obține toate items cu paginare, search și filter
  async getAllItems(ctx) {
    try {
      const userId = ctx.state.user.id;
      
      // Parametri de paginare
      const page = parseInt(ctx.request.query.page) || 1;
      const limit = parseInt(ctx.request.query.limit) || 10;
      
      // Parametri de filtrare
      const searchText = ctx.request.query.text || null;
      const completed = ctx.request.query.completed !== undefined 
        ? ctx.request.query.completed === 'true' 
        : null;

      // Obține items
      const result = await this.service.getAllItems(userId, searchText, completed, page, limit);
      
      ctx.response.status = 200;
      ctx.response.body = result;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Obține item după ID
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

  // Creează item nou
  async createItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const itemData = ctx.request.body;
      
      const newItem = await this.service.createItem(itemData, userId);
      
      ctx.response.status = 201;
      ctx.response.body = newItem;
      
      // Broadcast către WebSocket (doar pentru acest user)
      if (this.broadcast) {
        this.broadcast({
          event: 'created',
          userId,
          payload: { item: newItem }
        });
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Update item
  async updateItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const id = ctx.params.id;
      const itemData = ctx.request.body;
      const clientVersion = parseInt(ctx.request.get('ETag')) || itemData.version;
      
      const updatedItem = await this.service.updateItem(id, itemData, userId, clientVersion);
      
      ctx.response.status = 200;
      ctx.response.body = updatedItem;
      
      // Broadcast către WebSocket
      if (this.broadcast) {
        this.broadcast({
          event: 'updated',
          userId,
          payload: { item: updatedItem }
        });
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Delete item
  async deleteItem(ctx) {
    try {
      const userId = ctx.state.user.id;
      const id = ctx.params.id;
      
      const deletedItem = await this.service.deleteItem(id, userId);
      
      ctx.response.status = 200;
      ctx.response.body = { 
        message: 'Item deleted successfully',
        item: deletedItem 
      };
      
      // Broadcast către WebSocket
      if (this.broadcast) {
        this.broadcast({
          event: 'deleted',
          userId,
          payload: { item: deletedItem }
        });
      }
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  // Error handler - exact ca în original
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