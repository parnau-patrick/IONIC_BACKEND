const ItemValidator = require('../validation/itemValidator');

class ItemService {
  constructor(itemRepository) {
    this.repository = itemRepository;
  }

  async getAllItems(searchText = null) {
    if (searchText) {
      const validation = ItemValidator.validateSearchText(searchText);
      if (!validation.isValid) {
        throw {
          status: 400,
          message: validation.errors.join(', ')
        };
      }
      return await this.repository.findByText(searchText);
    }
    return await this.repository.findAll();
  }

  async getItemById(id) {
    const validation = ItemValidator.validateId(id);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const item = await this.repository.findById(id);
    
    if (!item) {
      throw {
        status: 404,
        message: `Item with id ${id} not found`
      };
    }
    
    return item;
  }

  async createItem(itemData) {
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
      date: new Date(),
      version: 1
    });
    
    return newItem;
  }

  async updateItem(id, itemData, clientVersion) {
    const idValidation = ItemValidator.validateId(id);
    if (!idValidation.isValid) {
      throw {
        status: 400,
        message: idValidation.errors.join(', ')
      };
    }

    const existingItem = await this.repository.findById(id);
    
    if (!existingItem) {
      return await this.createItem(itemData);
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

    // Verifică dacă doar completed s-a schimbat (toggle)
    const onlyCompletedChanged = 
      itemData.text === existingItem.text && 
      itemData.completed !== existingItem.completed;

    const updatedItem = await this.repository.update(id, {
      text: itemData.text,
      completed: itemData.completed,
      date: onlyCompletedChanged ? existingItem.date : new Date(),
      version: onlyCompletedChanged ? existingItem.version : existingItem.version + 1
    });
    
    return updatedItem;
  }

  async deleteItem(id) {
    const validation = ItemValidator.validateId(id);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const deletedItem = await this.repository.delete(id);
    
    if (!deletedItem) {
      throw {
        status: 404,
        message: `Item with id ${id} not found`
      };
    }
    
    return deletedItem;
  }

  async getLastUpdated() {
    return await this.repository.getLastUpdated();
  }

  async getCompletedItems() {
    const items = await this.repository.findAll();
    return items.filter(item => item.completed);
  }

  async getIncompleteItems() {
    const items = await this.repository.findAll();
    return items.filter(item => !item.completed);
  }
}

module.exports = ItemService;