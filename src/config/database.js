require('dotenv').config();
const { Sequelize } = require('sequelize');

class Database {
  constructor() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME ,
      process.env.DB_USER ,
      process.env.DB_PASSWORD ,
      {
        host: process.env.DB_HOST ,
        port: process.env.DB_PORT ,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }

  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('PostgreSQL connected successfully');
      
      await this.sequelize.sync({ alter: false });
      console.log('Database synchronized');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.sequelize.close();
      console.log('PostgreSQL disconnected');
    } catch (error) {
      console.error('PostgreSQL disconnect error:', error);
    }
  }

  getSequelize() {
    return this.sequelize;
  }
}

module.exports = new Database();