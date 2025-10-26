class ItemController {
  constructor(itemService, broadcast) {
    this.service = itemService;
    this.broadcast = broadcast;
  }

  async getAllItems(ctx) {
    try {
      const searchText = ctx.request.query.text;
      const ifModifiedSince = ctx.request.get('If-Modified-Since');
      
      const lastUpdated = await this.service.getLastUpdated();
      if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= lastUpdated.getTime()) {
        ctx.response.status = 304;
        return;
      }
      
      const items = await this.service.getAllItems(searchText);
      
      ctx.response.set('Last-Modified', lastUpdated.toUTCString());
      ctx.response.body = items;
      ctx.response.status = 200;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async getItemById(ctx) {
    try {
      const id = ctx.params.id;
      const item = await this.service.getItemById(id);
      
      ctx.response.body = item;
      ctx.response.status = 200;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async createItem(ctx) {
    try {
      const itemData = ctx.request.body;
      const newItem = await this.service.createItem(itemData);
      
      ctx.response.body = newItem;
      ctx.response.status = 201;
      
      this.broadcast({ event: 'created', payload: { item: newItem } });
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async updateItem(ctx) {
    try {
      const id = ctx.params.id;
      const itemData = ctx.request.body;
      const clientVersion = parseInt(ctx.request.get('ETag')) || itemData.version;
      
      const updatedItem = await this.service.updateItem(id, itemData, clientVersion);
      
      ctx.response.body = updatedItem;
      ctx.response.status = 200;
      
      this.broadcast({ event: 'updated', payload: { item: updatedItem } });
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  async deleteItem(ctx) {
    try {
      const id = ctx.params.id;
      const deletedItem = await this.service.deleteItem(id);
      
      ctx.response.status = 204;
      
      this.broadcast({ event: 'deleted', payload: { item: deletedItem } });
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