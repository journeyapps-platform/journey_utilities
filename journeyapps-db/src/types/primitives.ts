import {
  primitives as primitive,
  Type,
  EnumOption,
  ValueSerializeOptions,
  PrimitiveType
} from '@journeyapps/parser-schema';
import { Day, pureDate } from '@journeyapps/core-date';
import { Attachment, toBackendData } from './Attachment';
import { Location } from './Location';
import { isValid } from '../utils/uuid';

const moment = require('moment'); // tslint:disable-line

/**
 * Base Type mixin
 */

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

/**
 * Date and Datetime mixins
 */

primitive[PrimitiveType.DATE].prototype.valueToJSON = function (value: any) {
  if (value instanceof Date) {
    return value.toISOString().substring(0, 10);
  } else if (value instanceof Day) {
    return value.toISOString();
  } else {
    return null;
  }
};

primitive[PrimitiveType.DATE].prototype.valueFromJSON = function (value: any) {
  if (typeof value != 'string') {
    return null;
  }
  try {
    const day = new Day(value.substring(0, 10));
    if (this.isDay) {
      return day;
    } else {
      return day.toDate();
    }
  } catch (err) {
    return null;
  }
};

primitive[PrimitiveType.DATE].prototype.clone = function (value: any) {
  if (this.isDay) {
    return new Day(value);
  } else {
    return new Date(value.getTime());
  }
};

primitive[PrimitiveType.DATE].prototype.format = function (value: any, format: string = 'MMMM D YYYY') {
  // Works for Date and Day objects.
  if (value instanceof Day) {
    value = value.toDate();
  }
  const d = moment(value).utc();
  return d.format(format);
};

primitive[PrimitiveType.DATE].prototype.cast = function (value: any) {
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

primitive[PrimitiveType.DATETIME].prototype.valueToJSON = function (value: any) {
  if (value instanceof Date) {
    return value.toISOString();
  } else {
    return null;
  }
};

primitive[PrimitiveType.DATETIME].prototype.valueFromJSON = (value: string) => {
  if (typeof value == 'string') {
    const parsed = Date.parse(value);
    if (isNaN(parsed)) {
      return null;
    } else {
      return new Date(parsed);
    }
  } else {
    return null;
  }
};

primitive[PrimitiveType.DATETIME].prototype.clone = function (value: any) {
  return new Date(value.getTime());
};

primitive[PrimitiveType.DATETIME].prototype.format = function (value: any, format: string = 'MMMM D YYYY h:mm A') {
  return moment(value).format(format);
};

primitive[PrimitiveType.DATETIME].prototype.cast = (value: any) => {
  if (value instanceof Date) {
    return value;
  } else {
    throw new Error(value + ' is not a Date');
  }
};

/**
 * Other primitives
 */

primitive[PrimitiveType.BOOLEAN].prototype.format = function (value: any) {
  const option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive[PrimitiveType.TEXT].prototype.cast = function (value: any) {
  return value.toString();
};

primitive[PrimitiveType.NUMBER].prototype.format = function (value: any, format: string) {
  if (typeof value != 'number') {
    return 'NaN';
  }
  if (format == null) {
    const variable = value.toString();
    const fixed = value.toFixed(6);
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
      const digits = parseInt(format.substring(1, format.length - 1), 10);
      if (digits >= 0 && digits < 20) {
        return value.toFixed(digits);
      } else {
        return value.toFixed(6);
      }
    }
    return value.toString();
  }
};

primitive[PrimitiveType.NUMBER].prototype.cast = (value: any) => {
  if (typeof value == 'number') {
    return value;
  } else if (typeof value == 'string') {
    try {
      return parseFloat(value);
    } catch (e) {
      // fall through
    }
  }
  throw new Error(value + ' is not a number');
};

primitive[PrimitiveType.INTEGER].prototype.cast = function (value: any) {
  if (typeof value == 'number') {
    return Math.floor(value);
  } else if (typeof value == 'string') {
    try {
      return parseInt(value);
    } catch (e) {
      // fall through
    }
  }
  throw new Error(value + ' is not a integer');
};

/**
 * Attachment type mixins
 */

primitive[PrimitiveType.ATTACHMENT].prototype.cast = function (value: any) {
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

primitive[PrimitiveType.ATTACHMENT].prototype.valueToJSON = function (
  value: Attachment,
  options?: ValueSerializeOptions
) {
  if (!value) {
    return null;
  } else if (options?.inlineAttachments) {
    return value[toBackendData]();
  } else {
    return value.id;
  }
};

primitive[PrimitiveType.ATTACHMENT].prototype.valueFromJSON = function (value: any) {
  if (value != null) {
    return new Attachment(value);
  }
};

/**
 * Location type mixins
 */

primitive[PrimitiveType.LOCATION].prototype.valueFromJSON = function (value: any) {
  if (Array.isArray(value)) {
    // Array format
    const data = {
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

primitive[PrimitiveType.LOCATION].prototype.clone = function (value: any) {
  return new Location(value);
};

primitive[PrimitiveType.LOCATION].prototype.cast = function (value: any) {
  if (value instanceof Location) {
    return value;
  } else if (typeof value == 'object') {
    return new Location(value);
  } else {
    throw new Error(value + ' is not a valid location');
  }
};

/**
 * Choice Type mixins
 */

primitive[PrimitiveType.SINGLE_CHOICE_INTEGER].prototype.valueToJSON = function (value: any) {
  if (typeof value == 'number') {
    return value;
  } else {
    return null;
  }
};

primitive[PrimitiveType.SINGLE_CHOICE_INTEGER].prototype.valueFromJSON = function (value: any) {
  if (typeof value == 'number') {
    return value;
  } else {
    return null;
  }
};

primitive[PrimitiveType.SINGLE_CHOICE_INTEGER].prototype.cast = function (value: any) {
  let option: number = null;
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

primitive[PrimitiveType.SINGLE_CHOICE_INTEGER].prototype.format = function (value: any) {
  const option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive[PrimitiveType.SINGLE_CHOICE].prototype.format = function (value: any) {
  const option = this.options[value];
  if (option == null) {
    return '< invalid value >';
  } else {
    return option.label;
  }
};

primitive[PrimitiveType.MULTIPLE_CHOICE_INTEGER].prototype.cast = function (value: any) {
  if (!(value instanceof Array)) {
    throw new Error(value + ' is not an array');
  }

  for (let i = 0; i < value.length; i++) {
    const index = value[i];
    const option = this.options[index];
    if (option == null) {
      throw new Error(index + ' is not a valid option');
    }
  }

  return value;
};

function formatMultipleChoice(value: any[]) {
  const self = this;
  // value is an array of integers
  if (value == null || value.length === 0) {
    return '';
  } else {
    // Clone and sort the array, so that the labels are always in the same order.
    // Array.prototype.slice should work on any array-like object
    // Use schema order
    const clone = Array.prototype.slice.call(value, 0);
    clone.sort((a: any, b: any) => {
      const optionA = self.options[a];
      const optionB = self.options[b];
      if (optionA == null || optionB == null) {
        return 0; // safety-check
      }
      return optionA.index - optionB.index;
    });

    let result = '';
    for (let i = 0; i < clone.length; i++) {
      const v = clone[i];
      const option = this.options[v];
      let label = '< invalid value >';
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

primitive[PrimitiveType.MULTIPLE_CHOICE_INTEGER].prototype.format = formatMultipleChoice;

primitive[PrimitiveType.MULTIPLE_CHOICE].prototype.format = formatMultipleChoice;

// Re-export
export { Day, Attachment, Location };
