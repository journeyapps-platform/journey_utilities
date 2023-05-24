import { Variable } from './Variable';
import { Type } from './Type';
import { EnumOption } from './EnumOption';
import { TypeInterface } from '@journeyapps/evaluator';

export interface ChoicePrimitive extends TypeInterface {
  hasOptions: true;
  multipleOptions: boolean;
  addOption: (value: any, label: string, index: number) => EnumOption;
  toJSON: () => any;
  stringify: () => string;
}

export interface SingleChoiceIntegerPrimitive extends ChoicePrimitive {
  setOptionLabels: (labels: string[]) => any;
}

export enum PrimitiveType {
  TEXT = 'text',
  INTEGER = 'integer',
  SINGLE_CHOICE = 'single-choice',
  SINGLE_CHOICE_INTEGER = 'single-choice-integer',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  MULTIPLE_CHOICE = 'multiple-choice',
  MULTIPLE_CHOICE_INTEGER = 'multiple-choice-integer',
  LOCATION = 'location',
  ATTACHMENT = 'attachment',
  TRACK = 'track'
}

// Collection of primitive types.
// Each type is a constructor creating a default instance of that type.
export const primitives: { [index in PrimitiveType]: any } = {
  [PrimitiveType.TEXT]: function () {
    // No options
  },
  [PrimitiveType.INTEGER]: function () {
    // No options
  },
  [PrimitiveType.SINGLE_CHOICE_INTEGER]: function () {
    this.options = {};
  },
  [PrimitiveType.SINGLE_CHOICE]: function () {
    this.options = {};
  },
  [PrimitiveType.BOOLEAN]: function () {
    this.options = {};
  },
  [PrimitiveType.NUMBER]: function () {
    // No options
  },
  [PrimitiveType.DATE]: function () {
    // No options
  },
  [PrimitiveType.DATETIME]: function () {
    // No options
  },
  [PrimitiveType.MULTIPLE_CHOICE_INTEGER]: function () {
    this.options = {};
  },
  [PrimitiveType.MULTIPLE_CHOICE]: function () {
    this.options = {};
  },
  [PrimitiveType.LOCATION]: function () {
    // No options
  },
  [PrimitiveType.ATTACHMENT]: function () {
    // No options
  },
  [PrimitiveType.TRACK]: function () {
    // No options
  }
};

// Set the prototype for each primitive type
for (let key in primitives) {
  if (primitives.hasOwnProperty(key)) {
    // True => isPrimitiveType
    primitives[key].prototype = new Type(key, true);
  }
}

function extendWithOptions(proto: ChoicePrimitive, isInt: boolean, multiple: boolean) {
  function values(obj: any) {
    return Object.keys(obj).map(function (key) {
      return obj[key].toJSON();
    });
  }

  proto.stringify = function () {
    return this.name;
  };

  proto.addOption = function (value: any, label: string, index: number): EnumOption {
    if (value in this.options) {
      throw new Error("key '" + value + "' is already used");
    }
    this.options[value] = new EnumOption(value, label, index);
    return this.options[value];
  };

  proto.hasOptions = true;
  proto.multipleOptions = multiple;

  proto.toJSON = function () {
    return {
      options: values(this.options)
    };
  };

  if (isInt) {
    (proto as SingleChoiceIntegerPrimitive).setOptionLabels = function (labels: string[]) {
      this.options = {};
      for (var i = 0; i < labels.length; i++) {
        this.addOption(i, labels[i], i);
      }
    };
  }
}

extendWithOptions(primitives[PrimitiveType.SINGLE_CHOICE].prototype, false, false);
extendWithOptions(primitives[PrimitiveType.SINGLE_CHOICE_INTEGER].prototype, true, false);
extendWithOptions(primitives[PrimitiveType.MULTIPLE_CHOICE].prototype, false, true);
extendWithOptions(primitives[PrimitiveType.MULTIPLE_CHOICE_INTEGER].prototype, true, true);
extendWithOptions(primitives[PrimitiveType.BOOLEAN].prototype, false, false);

primitives.text.prototype.toJSON = function () {
  var json = {} as any;
  if (this.spec != null) {
    json.spec = this.spec;
  }
  if (this.subType != null) {
    json.subType = this.subType;
  }
  return json;
};

primitives.date.prototype.toJSON = function () {
  // Return either {} or {isDay: true}.
  // For consistency, we never return {isDay: undefined} or {isDay: false}.
  let json = {} as any;
  if (this.isDay) {
    json.isDay = true;
  }
  return json;
};

primitives.location.prototype.addAttribute(new Variable('latitude', new primitives.number()));
primitives.location.prototype.addAttribute(new Variable('longitude', new primitives.number()));
primitives.location.prototype.addAttribute(new Variable('altitude', new primitives.number()));
primitives.location.prototype.addAttribute(new Variable('horizontal_accuracy', new primitives.number()));
primitives.location.prototype.addAttribute(new Variable('vertical_accuracy', new primitives.number()));

export function primitive(name: string): Type {
  if (name == 'photo') {
    const photoType = new primitives.attachment();
    photoType.media = 'image/jpeg';
    photoType.stringify = () => {
      return 'photo';
    };
    return photoType;
  } else if (name == 'signature') {
    const signatureType = new primitives.attachment();
    signatureType.media = 'image/svg+xml';
    signatureType.stringify = () => {
      return 'signature';
    };
    return signatureType;
  }
  const Constructor = primitives[name];
  if (Constructor) {
    return new Constructor();
  } else {
    return null;
  }
}
