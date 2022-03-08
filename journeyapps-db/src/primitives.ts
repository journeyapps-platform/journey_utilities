import { primitives as primitive, Type, EnumOption, ValueSerializeOptions } from '@journeyapps/parser-schema';
import { Day, pureDate } from '@journeyapps/core-date';
import { Attachment, toBackendData } from './Attachment';
import { Location } from './Location';
import { isValid } from './utils/uuid';

const moment = require('moment'); // tslint:disable-line

Type.prototype.valueToJSON = function (value: any) {
  return value;
};

Type.prototype.valueFromJSON = function (value: any) {
  return value;
};

Type.prototype.clone = function (value: any) {
  return value;
};

// Subclasses should override this to validate the value type. If the value is not a valid type, an Error must be
// thrown.
// `value` must not be null or undefined.
Type.prototype.cast = function (value: any) {
  return value;
};

primitive['single-choice-integer'].prototype.valueToJSON = function (value: any) {
  if (typeof value == 'number') {
    return value;
  } else {
    return null;
  }
};

primitive['single-choice-integer'].prototype.valueFromJSON = function (value: any) {
  if (typeof value == 'number') {
    return value;
  } else {
    return null;
  }
};

primitive.date.prototype.valueToJSON = function (value: any) {
  if (value instanceof Date) {
    return value.toISOString().substring(0, 10);
  } else if (value instanceof Day) {
    return value.toISOString();
  } else {
    return null;
  }
};

function parseDateTime(value: string) {
  if (typeof value == 'string') {
    var parsed = Date.parse(value);
    if (isNaN(parsed)) {
      return null;
    } else {
      return new Date(parsed);
    }
  } else {
    return null;
  }
}

primitive.date.prototype.valueFromJSON = function (value: any) {
  if (typeof value != 'string') {
    return null;
  }
  try {
    var day = new Day(value.substring(0, 10));
    if (this.isDay) {
      return day;
    } else {
      return day.toDate();
    }
  } catch (err) {
    return null;
  }
};

primitive.datetime.prototype.valueToJSON = function (value: any) {
  if (value instanceof Date) {
    return value.toISOString();
  } else {
    return null;
  }
};

primitive.datetime.prototype.valueFromJSON = parseDateTime;

primitive.date.prototype.clone = function (value: any) {
  if (this.isDay) {
    return new Day(value);
  } else {
    return new Date(value.getTime());
  }
};

primitive.datetime.prototype.clone = function (value: any) {
  return new Date(value.getTime());
};

primitive.location.prototype.valueFromJSON = function (value: any) {
  if (Array.isArray(value)) {
    // Array format
    var data = {
      latitude: value[0],
      longitude: value[1],
      altitude: value[2],
      horizontal_accuracy: value[3],
      vertical_accuracy: value[4],
      timestamp: value[5]
    };
    return new Location(data);
  } else {
    // Object format
    return new Location(value);
  }
};

primitive.location.prototype.clone = function (value: any) {
  return new Location(value);
};

primitive.number.prototype.format = function (value: any, format: string) {
  if (typeof value != 'number') {
    return 'NaN';
  }
  if (format == null) {
    var variable = value.toString();
    var fixed = value.toFixed(6);
    if (variable.length < fixed.length) {
      if (variable.indexOf('.') == -1 && variable.indexOf(',') == -1) {
        // We want to append .0 to integers
        return value.toFixed(1);
      } else {
        return variable;
      }
    } else {
      return fixed;
    }
  } else {
    if (format.length >= 3 && format[0] == '.' && format[format.length - 1] == 'f') {
      var digits = parseInt(format.substring(1, format.length - 1), 10);
      if (digits >= 0 && digits < 20) {
        return value.toFixed(digits);
      } else {
        return value.toFixed(6);
      }
    }
    return value.toString();
  }
};

primitive.datetime.prototype.format = function (value: any, format: string) {
  return moment(value).format('MMMM D YYYY h:mm A');
};

primitive.date.prototype.format = function (value: any, format: string) {
  // Works for Date and Day objects.
  if (value instanceof Day) {
    value = value.toDate();
  }
  const d = moment(value).utc();
  return d.format('MMMM D YYYY');
};

primitive.text.prototype.cast = function (value: any) {
  return value.toString();
};

function typeValidator(type: string) {
  return function cast(value: any) {
    if (typeof value == type) {
      return value;
    } else {
      throw new Error(value + ' is not a ' + type);
    }
  };
}

var numberValidator = typeValidator('number');

primitive.number.prototype.cast = numberValidator;
primitive.integer.prototype.cast = function (value: any) {
  return Math.floor(numberValidator(value));
};

primitive['single-choice-integer'].prototype.cast = function (value: any) {
  var option: number = null;
  if (typeof value == 'number') {
    option = value;
  } else if (value instanceof EnumOption) {
    // We convert enums to a plain integer
    option = value.value as number;
  }
  if (this.options[option] == null) {
    throw new Error(value + ' is not a valid enum value');
  } else {
    return option;
  }
};

primitive['single-choice-integer'].prototype.format = function (value: any) {
  var option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive['single-choice'].prototype.format = function (value: any) {
  var option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive.boolean.prototype.format = function (value: any) {
  var option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive['multiple-choice-integer'].prototype.cast = function (value: any) {
  if (!(value instanceof Array)) {
    throw new Error(value + ' is not an array');
  }

  for (var i = 0; i < value.length; i++) {
    var index = value[i];
    var option = this.options[index];
    if (option == null) {
      throw new Error(index + ' is not a valid option');
    }
  }

  return value;
};

function formatMultipleChoice(value: any[]) {
  var self = this;
  // value is an array of integers
  if (value == null || value.length === 0) {
    return '';
  } else {
    // Clone and sort the array, so that the labels are always in the same order.
    // Array.prototype.slice should work on any array-like object
    // Use schema order
    var clone = Array.prototype.slice.call(value, 0);
    clone.sort(function (a: any, b: any) {
      var optionA = self.options[a];
      var optionB = self.options[b];
      if (optionA == null || optionB == null) {
        return 0; // safety-check
      }
      return optionA.index - optionB.index;
    });

    var result = '';
    for (var i = 0; i < clone.length; i++) {
      var v = clone[i];
      var option = this.options[v];
      var label = '< invalid value >';
      if (option != null) {
        label = option.label;
      }
      result += label;
      if (i < value.length - 1) {
        result += ', ';
      }
    }
    return result;
  }
}

primitive['multiple-choice-integer'].prototype.format = formatMultipleChoice;

primitive['multiple-choice'].prototype.format = formatMultipleChoice;

function validateDate(value: any) {
  if (value instanceof Date) {
    return value;
  } else {
    throw new Error(value + ' is not a Date');
  }
}

primitive.date.prototype.cast = function (value: any) {
  if (this.isDay) {
    if (value instanceof Day) {
      return value;
    } else if (value instanceof Date) {
      // Convert from local timezone
      return new Day(value);
    } else {
      throw new Error(value + ' is not a Day');
    }
  } else {
    if (value instanceof Date) {
      // Assume UTC timezone
      return pureDate(value);
    } else if (value instanceof Day) {
      return value.toDate();
    } else {
      throw new Error(value + ' is not a Date');
    }
  }
};

primitive.datetime.prototype.cast = validateDate;

primitive.attachment.prototype.cast = function (value: any) {
  if (Attachment.isAttachment(value)) {
    return value;
  } else if (typeof value == 'string') {
    if (!isValid(value)) {
      throw new Error(value + ' is not a valid id');
    } else {
      return new Attachment(value);
    }
  } else if (typeof value == 'object') {
    return new Attachment(value);
  } else {
    throw new Error(value + ' is not a valid id');
  }
};

primitive.attachment.prototype.valueToJSON = function (value: Attachment, options?: ValueSerializeOptions) {
  if (!value) {
    return null;
  } else if (options?.inlineAttachments) {
    return value[toBackendData]();
  } else {
    return value.id;
  }
};

primitive.attachment.prototype.valueFromJSON = function (value: any) {
  if (value != null) {
    return new Attachment(value);
  }
};

primitive.location.prototype.cast = function (value: any) {
  if (value instanceof Location) {
    return value;
  } else if (typeof value == 'object') {
    return new Location(value);
  } else {
    throw new Error(value + ' is not a valid location');
  }
};

// Re-export
export { Day, Attachment, Location };
