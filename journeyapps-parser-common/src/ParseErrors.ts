import { error, XMLPositional, ValidationError, ErrorType } from '@journeyapps/core-xml';
import { XMLError } from '@journeyapps/domparser/types';

export class ParseErrors {
  private errors: (ValidationError | XMLError)[];

  constructor() {
    this.errors = [];
  }

  pushError(element: XMLPositional, message: string, type?: ErrorType) {
    this.errors.push(error(element, message, type));
  }

  pushErrors(newErrors: (ValidationError | XMLError)[]) {
    for (var i = 0; i < newErrors.length; i++) {
      var err = newErrors[i];
      this.errors.push(err);
    }
  }

  reset() {
    this.errors = [];
  }

  getErrors() {
    return this.errors;
  }
}
