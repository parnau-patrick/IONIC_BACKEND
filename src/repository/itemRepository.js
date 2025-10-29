const Item = require('../models/item');
const { Op } = require('sequelize');

class ItemRepository {
  
  
  async findAllWithFilters(userId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const whereClause = { userId };
    
    if (filters.text) {
      whereClause.text = {
        [Op.iLike]: `%${filters.text}%`
      };
    }
    
    if (filters.completed !== undefined && filters.completed !== null) {
      whereClause.completed = filters.completed;
    }
    
    const dateConditions = this.buildDateFilter(filters.dateFilter, filters.customStart, filters.customEnd);
    if (dateConditions) {
      Object.assign(whereClause, dateConditions);
    }
    
    const { count, rows } = await Item.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        ['dueDate', 'ASC'],      
        ['createdAt', 'DESC']    
      ]
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

 
  buildDateFilter(dateFilter, customStart, customEnd) {
    if (!dateFilter || dateFilter === 'all') {
      return null;
    }

    const now = new Date();
    
    switch (dateFilter) {
      case 'today': {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        return {
          dueDate: {
            [Op.between]: [startOfDay, endOfDay]
          }
        };
      }
      
      case 'tomorrow': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
        
        return {
          dueDate: {
            [Op.between]: [startOfDay, endOfDay]
          }
        };
      }
      
      case 'this-week': {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        return {
          dueDate: {
            [Op.between]: [now, endOfWeek]
          }
        };
      }
      
      case 'this-month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        return {
          dueDate: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        };
      }
      
      case 'next-month': {
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
        
        return {
          dueDate: {
            [Op.between]: [startOfNextMonth, endOfNextMonth]
          }
        };
      }
      
      case 'overdue': {
        return {
          dueDate: {
            [Op.lt]: now
          },
          completed: false
        };
      }
      
      case 'no-date': {
        return {
          dueDate: {
            [Op.is]: null
          }
        };
      }
      
      case 'has-date': {
        return {
          dueDate: {
            [Op.not]: null
          }
        };
      }
      
      case 'custom': {
        if (customStart && customEnd) {
          return {
            dueDate: {
              [Op.between]: [new Date(customStart), new Date(customEnd)]
            }
          };
        } else if (customStart) {
          return {
            dueDate: {
              [Op.gte]: new Date(customStart)
            }
          };
        } else if (customEnd) {
          return {
            dueDate: {
              [Op.lte]: new Date(customEnd)
            }
          };
        }
        return null;
      }
      
      default:
        return null;
    }
  }

  async findAll(userId, page = 1, limit = 10) {
    return this.findAllWithFilters(userId, {}, page, limit);
  }

  async findByText(searchText, userId, page = 1, limit = 10) {
    return this.findAllWithFilters(userId, { text: searchText }, page, limit);
  }

  async findByCompleted(completed, userId, page = 1, limit = 10) {
    return this.findAllWithFilters(userId, { completed }, page, limit);
  }

 
  async getDateStatistics(userId) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [overdue, today, thisWeek, noDate] = await Promise.all([
      Item.count({
        where: {
          userId,
          completed: false,
          dueDate: { [Op.lt]: now }
        }
      }),
      
      Item.count({
        where: {
          userId,
          dueDate: {
            [Op.between]: [
              new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            ]
          }
        }
      }),
      
      Item.count({
        where: {
          userId,
          dueDate: {
            [Op.between]: [now, nextWeek]
          }
        }
      }),
      
      Item.count({
        where: {
          userId,
          dueDate: { [Op.is]: null }
        }
      })
    ]);

    return {
      overdue,
      today,
      thisWeek,
      noDate,
      total: await Item.count({ where: { userId } })
    };
  }

  async findById(id, userId) {
    return await Item.findOne({
      where: { id, userId }
    });
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