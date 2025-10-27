const ItemValidator = require('../validation/itemValidator');

// Item Service - business logic layer (exact ca în original dar cu userId)
class ItemService {
  constructor(itemRepository) {
    this.repository = itemRepository;
  }

  // Obține toate items pentru user cu paginare și filtrare
  async getAllItems(userId, searchText = null, completed = null, page = 1, limit = 10) {
    // Validare pagination
    const paginationValidation = ItemValidator.validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      throw {
        status: 400,
        message: paginationValidation.errors.join(', ')
      };
    }

    // Dacă există search text
    if (searchText) {
      const validation = ItemValidator.validateSearchText(searchText);
      if (!validation.isValid) {
        throw {
          status: 400,
          message: validation.errors.join(', ')
        };
      }
      return await this.repository.findByText(searchText, userId, page, limit);
    }

    // Dacă există filter pentru completed
    if (completed !== null && completed !== undefined) {
      return await this.repository.findByCompleted(completed, userId, page, limit);
    }

    // Altfel returnează toate
    return await this.repository.findAll(userId, page, limit);
  }

  // Obține item după ID
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

  // Creează item nou
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
      userId,
      version: 1
    });
    
    return newItem;
  }

  // Update item
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
    
    // Verificare version conflict (optimistic locking)
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

    // Update item cu incrementare versiune
    const updatedItem = await this.repository.update(id, userId, {
      text: itemData.text !== undefined ? itemData.text : existingItem.text,
      completed: itemData.completed !== undefined ? itemData.completed : existingItem.completed,
      version: existingItem.version + 1 // Întotdeauna incrementăm versiunea
    });
    
    return updatedItem;
  }

  // Delete item
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

  // Obține ultima actualizare pentru user
  async getLastUpdated(userId) {
    return await this.repository.getLastUpdated(userId);
  }

  // Obține item-urile completed pentru user
  async getCompletedItems(userId, page = 1, limit = 10) {
    return await this.repository.findByCompleted(true, userId, page, limit);
  }

  // Obține item-urile incomplete pentru user
  async getIncompleteItems(userId, page = 1, limit = 10) {
    return await this.repository.findByCompleted(false, userId, page, limit);
  }
}

module.exports = ItemService;