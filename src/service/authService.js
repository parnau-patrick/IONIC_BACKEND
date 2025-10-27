const jwt = require('jsonwebtoken');
const UserValidator = require('../validation/userValidator');

const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key-for-university-project';
const JWT_EXPIRES_IN = '7d'; 

// Auth Service - business logic pentru autentificare
class AuthService {
  constructor(userRepository) {
    this.repository = userRepository;
  }

  // Generează JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verifică JWT token
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

  // Register user nou
  async register(userData) {
    // Validare input
    const validation = UserValidator.validateRegister(userData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    // Verifică dacă username sau email există deja
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

    // Creează user (password va fi hash-uit automat în model)
    const user = await this.repository.create({
      username: userData.username,
      email: userData.email,
      password: userData.password
    });

    // Generează token
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

  // Login user
  async login(userData) {
    // Validare input
    const validation = UserValidator.validateLogin(userData);
    if (!validation.isValid) {
      throw {
        status: 400,
        message: validation.errors.join(', ')
      };
    }

    // Găsește user după username
    const user = await this.repository.findByUsername(userData.username);

    if (!user) {
      throw {
        status: 401,
        message: 'Invalid credentials'
      };
    }

    // Verifică password
    const isMatch = await user.comparePassword(userData.password);

    if (!isMatch) {
      throw {
        status: 401,
        message: 'Invalid credentials'
      };
    }

    // Generează token
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

  // Obține user curent
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