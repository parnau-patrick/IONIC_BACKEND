const ItemValidator = require('../validation/itemValidator');

class ItemService {
  constructor(itemRepository) {
    this.repository = itemRepository;
  }

  
  async getAllItems(userId, filters = {}, page = 1, limit = 10) {
    const paginationValidation = ItemValidator.validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      throw {
        status: 400,
        message: paginationValidation.errors.join(', ')
      };
    }

    if (filters.text) {
      const validation = ItemValidator.validateSearchText(filters.text);
      if (!validation.isValid) {
        throw {
          status: 400,
          message: validation.errors.join(', ')
        };
      }
    }

    if (filters.dateFilter) {
      const validation = ItemValidator.validateDateFilter(
        filters.dateFilter, 
        filters.customStart, 
        filters.customEnd
      );
      if (!validation.isValid) {
        throw {
          status: 400,
          message: validation.errors.join(', ')
        };
      }
    }

    return await this.repository.findAllWithFilters(userId, filters, page, limit);
  }

  async getItemById(id, userId) {
    const validation = ItemValidator.validateId(id);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const item = await this.repository.findById(id, userId);
    
    if (!item) {
      throw {
        status: 404,
        message: `Item with id ${id} not found`
      };
    }
    
    return item;
  }

  async createItem(itemData, userId) {
    const validation = ItemValidator.validateForCreate(itemData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const newItem = await this.repository.save({
      text: itemData.text,
      completed: itemData.completed || false,
      dueDate: itemData.dueDate || null,
      userId,
      version: 1
    });
    
    return newItem;
  }

  async updateItem(id, itemData, userId, clientVersion) {
    const idValidation = ItemValidator.validateId(id);
    if (!idValidation.isValid) {
      throw {
        status: 400,
        message: idValidation.errors.join(', ')
      };
    }

    const existingItem = await this.repository.findById(id, userId);
    
    if (!existingItem) {
      throw {
        status: 404,
        message: `Item with id ${id} not found`
      };
    }
    
    const conflictCheck = ItemValidator.validateVersionConflict(clientVersion, existingItem.version);
    if (conflictCheck.hasConflict) {
      throw {
        status: 409,
        message: conflictCheck.message
      };
    }
    
    const validation = ItemValidator.validateForUpdate(itemData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const updatedItem = await this.repository.update(id, userId, {
      text: itemData.text !== undefined ? itemData.text : existingItem.text,
      completed: itemData.completed !== undefined ? itemData.completed : existingItem.completed,
      dueDate: itemData.dueDate !== undefined ? itemData.dueDate : existingItem.dueDate,
      version: existingItem.version + 1
    });
    
    return updatedItem;
  }

  async deleteItem(id, userId) {
    const validation = ItemValidator.validateId(id);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const deletedItem = await this.repository.delete(id, userId);
    
    if (!deletedItem) {
      throw {
        status: 404,
        message: `Item with id ${id} not found`
      };
    }
    
    return deletedItem;
  }

  async getDateStatistics(userId) {
    return await this.repository.getDateStatistics(userId);
  }

  async getLastUpdated(userId) {
    return await this.repository.getLastUpdated(userId);
  }

  async getCompletedItems(userId, page = 1, limit = 10) {
    return await this.repository.findByCompleted(true, userId, page, limit);
  }

  async getIncompleteItems(userId, page = 1, limit = 10) {
    return await this.repository.findByCompleted(false, userId, page, limit);
  }
}

module.exports = ItemService;