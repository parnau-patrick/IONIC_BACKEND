// Item Validator - exact ca în proiectul original
class ItemValidator {
  
  // Validare completă item
  static validate(item) {
    const errors = [];
    
    // Validare text
    if (!item.text) {
      errors.push('Text is required');
    } else if (typeof item.text !== 'string') {
      errors.push('Text must be a string');
    } else if (item.text.trim() === '') {
      errors.push('Text cannot be empty');
    } else if (item.text.length > 200) {
      errors.push('Text must be less than 200 characters');
    } else if (item.text.length < 3) {
      errors.push('Text must be at least 3 characters');
    }
    
    // Validare completed
    if (item.completed !== undefined && item.completed !== null) {
      if (typeof item.completed !== 'boolean') {
        errors.push('Completed must be a boolean');
      }
    }
    
    // Validare version
    if (item.version !== undefined && item.version !== null) {
      if (typeof item.version !== 'number') {
        errors.push('Version must be a number');
      } else if (!Number.isInteger(item.version) || item.version < 1) {
        errors.push('Version must be a positive integer');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Validare pentru create (nu e nevoie de version)
  static validateForCreate(itemData) {
    const item = {
      text: itemData.text,
      completed: itemData.completed
    };
    
    return this.validate(item);
  }
  
  // Validare pentru update (include tot)
  static validateForUpdate(itemData) {
    return this.validate(itemData);
  }
  
  // Validare ID
  static validateId(id) {
    const errors = [];
    
    if (!id) {
      errors.push('ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Validare search text
  static validateSearchText(text) {
    const errors = [];
    
    if (text !== null && text !== undefined) {
      if (typeof text !== 'string') {
        errors.push('Search text must be a string');
      } else if (text.length > 100) {
        errors.push('Search text must be less than 100 characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Validare version conflict (optimistic locking)
  static validateVersionConflict(clientVersion, serverVersion) {
    if (!clientVersion || !serverVersion) {
      return { hasConflict: false };
    }
    
    const hasConflict = clientVersion < serverVersion;
    
    return {
      hasConflict,
      message: hasConflict 
        ? `Version conflict: client version (${clientVersion}) is older than server version (${serverVersion})`
        : null
    };
  }

  // Validare pagination parameters
  static validatePagination(page, limit) {
    const errors = [];
    
    if (page && (!Number.isInteger(page) || page < 1)) {
      errors.push('Page must be a positive integer');
    }
    
    if (limit && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ItemValidator;