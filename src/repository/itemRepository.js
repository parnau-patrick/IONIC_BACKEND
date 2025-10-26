const Item = require('../models/item');
const { Op } = require('sequelize');

class ItemRepository {
  async findAll() {
    return await Item.findAll({
      order: [['date', 'DESC']]
    });
  }

  async findById(id) {
    return await Item.findByPk(id);
  }

  async findByText(searchText) {
    return await Item.findAll({
      where: {
        text: {
          [Op.iLike]: `%${searchText}%`
        }
      },
      order: [['date', 'DESC']]
    });
  }

  async save(itemData) {
    return await Item.create(itemData);
  }

  async update(id, itemData) {
    const item = await Item.findByPk(id);
    if (!item) return null;
    
    await item.update(itemData);
    return item;
  }

  async delete(id) {
    const item = await Item.findByPk(id);
    if (!item) return null;
    
    await item.destroy();
    return item;
  }

  async exists(id) {
    const count = await Item.count({ where: { id } });
    return count > 0;
  }

  async getLastUpdated() {
    const item = await Item.findOne({
      order: [['date', 'DESC']]
    });
    return item ? item.date : new Date();
  }

  async count() {
    return await Item.count();
  }
}

module.exports = ItemRepository;