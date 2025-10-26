const { DataTypes } = require('sequelize');
const database = require('../config/database');

const ItemModel = database.getSequelize().define('Item', {
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
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'items',
  timestamps: false
});

ItemModel.prototype.toggleCompleted = function() {
  this.completed = !this.completed;
};

ItemModel.prototype.incrementVersion = function() {
  this.version += 1;
};

module.exports = ItemModel;