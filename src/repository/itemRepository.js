const Item = require('../models/item');
const { Op } = require('sequelize');

// Item Repository - exact ca în proiectul original dar cu suport pentru userId
class ItemRepository {
  
  // Găsește toate item-urile pentru un user, cu paginare
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

  // Găsește item după ID și userId (pentru securitate)
  async findById(id, userId) {
    return await Item.findOne({
      where: { id, userId }
    });
  }

  // Găsește items după text (search) pentru un user
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

  // Găsește items după completed status
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

  // Salvează un item nou
  async save(itemData) {
    return await Item.create(itemData);
  }

  // Update item
  async update(id, userId, itemData) {
    const item = await this.findById(id, userId);
    if (!item) return null;
    
    await item.update(itemData);
    return item;
  }

  // Delete item
  async delete(id, userId) {
    const item = await this.findById(id, userId);
    if (!item) return null;
    
    await item.destroy();
    return item;
  }

  // Verifică dacă există un item
  async exists(id, userId) {
    const count = await Item.count({ 
      where: { id, userId } 
    });
    return count > 0;
  }

  // Obține ultima dată de update pentru un user
  async getLastUpdated(userId) {
    const item = await Item.findOne({
      where: { userId },
      order: [['updatedAt', 'DESC']]
    });
    return item ? item.updatedAt : new Date();
  }

  // Numără item-urile pentru un user
  async count(userId) {
    return await Item.count({ 
      where: { userId } 
    });
  }
}

module.exports = ItemRepository;