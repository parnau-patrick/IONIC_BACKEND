const jwt = require('jsonwebtoken');
const UserValidator = require('../validation/userValidator');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; 

class AuthService {
  constructor(userRepository) {
    this.repository = userRepository;
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw {
        status: 401,
        message: 'Invalid or expired token'
      };
    }
  }

  async register(userData) {
    const validation = UserValidator.validateRegister(userData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const existingUser = await this.repository.findByUsernameOrEmail(
      userData.username,
      userData.email
    );

    if (existingUser) {
      throw {
        status: 400,
        message: 'Username or email already exists'
      };
    }

    const user = await this.repository.create({
      username: userData.username,
      email: userData.email,
      password: userData.password
    });

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  async login(userData) {
    const validation = UserValidator.validateLogin(userData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    const user = await this.repository.findByUsername(userData.username);

    if (!user) {
      throw {
        status: 401,
        message: 'Invalid credentials'
      };
    }

    const isMatch = await user.comparePassword(userData.password);

    if (!isMatch) {
      throw {
        status: 401,
        message: 'Invalid credentials'
      };
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  async getCurrentUser(userId) {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw {
        status: 404,
        message: 'User not found'
      };
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }
}

module.exports = AuthService;