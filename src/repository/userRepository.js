const User = require('../models/User');
const { Op } = require('sequelize');

// User Repository pentru operațiuni cu useri
class UserRepository {
  
  // Găsește user după ID
  async findById(id) {
    return await User.findByPk(id);
  }

  // Găsește user după username
  async findByUsername(username) {
    return await User.findOne({
      where: { username }
    });
  }

  // Găsește user după email
  async findByEmail(email) {
    return await User.findOne({
      where: { email }
    });
  }

  // Găsește user după username SAU email
  async findByUsernameOrEmail(username, email) {
    return await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
  }

  // Creează user nou
  async create(userData) {
    return await User.create(userData);
  }

  // Verifică dacă username există
  async usernameExists(username) {
    const count = await User.count({ where: { username } });
    return count > 0;
  }

  // Verifică dacă email există
  async emailExists(email) {
    const count = await User.count({ where: { email } });
    return count > 0;
  }
}

module.exports = UserRepository;