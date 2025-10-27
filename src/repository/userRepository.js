const User = require('../models/User');
const { Op } = require('sequelize');

class UserRepository {
  
  async findById(id) {
    return await User.findByPk(id);
  }

  async findByUsername(username) {
    return await User.findOne({
      where: { username }
    });
  }

  async findByEmail(email) {
    return await User.findOne({
      where: { email }
    });
  }

  async findByUsernameOrEmail(username, email) {
    return await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async usernameExists(username) {
    const count = await User.count({ where: { username } });
    return count > 0;
  }

  async emailExists(email) {
    const count = await User.count({ where: { email } });
    return count > 0;
  }
}

module.exports = UserRepository;