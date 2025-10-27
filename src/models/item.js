const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Item = database.getSequelize().define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'items',
  timestamps: true 
});

Item.prototype.toggleCompleted = function() {
  this.completed = !this.completed;
};

Item.prototype.incrementVersion = function() {
  this.version += 1;
};

module.exports = Item;