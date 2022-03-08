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

// Collection of primitive types.
// Each type is a constructor creating a default instance of that type.
export const primitives: { [index: string]: any } = {
  text: function () {
    // No options
  },
  integer: function () {
    // No options
  },
  'single-choice-integer': function () {
    this.options = {};
  },
  'single-choice': function () {
    this.options = {};
  },
  boolean: function () {
    this.options = {};
  },
  number: function () {
    // No options
  },
  date: function () {
    // No options
  },
  datetime: function () {
    // No options
  },
  'multiple-choice-integer': function () {
    this.options = {};
  },
  'multiple-choice': function () {
    this.options = {};
  },
  location: function () {
    // No options
  },
  attachment: function () {
    // No options
  },
  track: function () {
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

extendWithOptions(primitives['single-choice'].prototype, false, false);
extendWithOptions(primitives['single-choice-integer'].prototype, true, false);
extendWithOptions(primitives['multiple-choice'].prototype, false, true);
extendWithOptions(primitives['multiple-choice-integer'].prototype, true, true);
extendWithOptions(primitives['boolean'].prototype, false, false);

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
