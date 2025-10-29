class ItemValidator {
  
  static validate(item) {
    const errors = [];
    
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
    
    if (item.completed !== undefined && item.completed !== null) {
      if (typeof item.completed !== 'boolean') {
        errors.push('Completed must be a boolean');
      }
    }

    if (item.version !== undefined && item.version !== null) {
      if (typeof item.version !== 'number') {
        errors.push('Version must be a number');
      } else if (!Number.isInteger(item.version) || item.version < 1) {
        errors.push('Version must be a positive integer');
      }
    }

    if (item.dueDate !== undefined && item.dueDate !== null) {
      const dueDate = new Date(item.dueDate);
      
      if (isNaN(dueDate.getTime())) {
        errors.push('Due date must be a valid date');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateForCreate(itemData) {
    const item = {
      text: itemData.text,
      completed: itemData.completed,
      dueDate: itemData.dueDate
    };
    
    return this.validate(item);
  }
  
  static validateForUpdate(itemData) {
    return this.validate(itemData);
  }
  
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

  static validateDateFilter(dateFilter, customStart, customEnd) {
    const errors = [];
    
    const validFilters = [
      'all', 'today', 'tomorrow', 'this-week', 'this-month', 'next-month',
      'overdue', 'no-date', 'has-date', 'custom'
    ];
    
    if (!validFilters.includes(dateFilter)) {
      errors.push(`Date filter must be one of: ${validFilters.join(', ')}`);
    }
    
    if (dateFilter === 'custom') {
      if (!customStart && !customEnd) {
        errors.push('Custom date filter requires at least customStart or customEnd');
      }
      
      if (customStart) {
        const start = new Date(customStart);
        if (isNaN(start.getTime())) {
          errors.push('customStart must be a valid date');
        }
      }
      
      if (customEnd) {
        const end = new Date(customEnd);
        if (isNaN(end.getTime())) {
          errors.push('customEnd must be a valid date');
        }
      }
      
      if (customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        if (start > end) {
          errors.push('customStart must be before customEnd');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
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