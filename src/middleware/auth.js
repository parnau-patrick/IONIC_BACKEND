const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (ctx, next) => {
  try {
    const authHeader = ctx.request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.state.user = user;
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired token' };
  }
};

module.exports = { authMiddleware, JWT_SECRET };