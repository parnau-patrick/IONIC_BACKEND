class UserValidator {
  
  static validateRegister(userData) {
    const errors = [];
    

    if (!userData.username) {
      errors.push('Username is required');
    } else if (typeof userData.username !== 'string') {
      errors.push('Username must be a string');
    } else if (userData.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (userData.username.length > 50) {
      errors.push('Username must be less than 50 characters');
    }
    
    if (!userData.email) {
      errors.push('Email is required');
    } else if (typeof userData.email !== 'string') {
      errors.push('Email must be a string');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Email is not valid');
    }
    
    if (!userData.password) {
      errors.push('Password is required');
    } else if (typeof userData.password !== 'string') {
      errors.push('Password must be a string');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateLogin(userData) {
    const errors = [];
    
    if (!userData.username) {
      errors.push('Username is required');
    }
    
    if (!userData.password) {
      errors.push('Password is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = UserValidator;