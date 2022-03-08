import { XMLElement } from '@journeyapps/domparser/types';

export class EnumOption {
  /** They key */
  value: string | number | boolean;

  label: string;

  index: number;

  sourceElement: XMLElement;

  constructor(key: string | number | boolean, label: string, index?: number) {
    this.value = key;
    this.label = label;
    this.index = index;
  }

  toJSON() {
    return {
      value: this.value,
      label: this.label,
      index: this.index
    };
  }
}
