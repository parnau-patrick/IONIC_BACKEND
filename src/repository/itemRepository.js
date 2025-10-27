const Item = require('../models/item');
const { Op } = require('sequelize');

class ItemRepository {
  
  async findAll(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Item.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id, userId) {
    return await Item.findOne({
      where: { id, userId }
    });
  }

  async findByText(searchText, userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Item.findAndCountAll({
      where: {
        userId,
        text: {
          [Op.iLike]: `%${searchText}%`
        }
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findByCompleted(completed, userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Item.findAndCountAll({
      where: { userId, completed },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async save(itemData) {
    return await Item.create(itemData);
  }

  async update(id, userId, itemData) {
    const item = await this.findById(id, userId);
    if (!item) return null;
    
    await item.update(itemData);
    return item;
  }

  async delete(id, userId) {
    const item = await this.findById(id, userId);
    if (!item) return null;
    
    await item.destroy();
    return item;
  }

  async exists(id, userId) {
    const count = await Item.count({ 
      where: { id, userId } 
    });
    return count > 0;
  }

  async getLastUpdated(userId) {
    const item = await Item.findOne({
      where: { userId },
      order: [['updatedAt', 'DESC']]
    });
    return item ? item.updatedAt : new Date();
  }

  async count(userId) {
    return await Item.count({ 
      where: { userId } 
    });
  }
}

module.exports = ItemRepository;