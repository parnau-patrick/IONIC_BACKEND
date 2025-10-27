const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pentru verificare JWT token
const authMiddleware = async (ctx, next) => {
  try {
    // Obține token din header Authorization
    const authHeader = ctx.request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    // Extrage token (elimină 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verifică token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Găsește user
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not found' };
      return;
    }

    // Atașează user la context (ctx.state.user)
    ctx.state.user = user;
    
    // Continuă cu următorul middleware
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired token' };
  }
};

module.exports = { authMiddleware, JWT_SECRET };