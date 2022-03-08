import { QueryType, Type } from '@journeyapps/parser-schema';
import { ParseErrors } from '@journeyapps/parser-common';
import * as evaluator from '@journeyapps/evaluator';
import { Component } from '../app/view';
import { XMLElement } from '@journeyapps/domparser/types';
import { isRawTokenFunctionExpression } from './parserUtils';
import { attributeValuePosition, elementTextPosition, getAttribute } from '@journeyapps/core-xml';

export class Formatter {
  constructor(
    private errorHandler: ParseErrors,
    private recordReferences: boolean,
    private fieldReferences: {
      type: string;
      isPrimitiveType: boolean;
      name: string;
    }[][]
  ) {}

  format(element: XMLElement, attribute: string, scopeType: Type, checkRawTokenExpression = false) {
    let value = getAttribute(element, attribute);
    if (value == null) {
      return null;
    }
    if (checkRawTokenExpression && isRawTokenFunctionExpression(value)) {
      value = `{${value}}`;
    }
    const formatString = evaluator.formatString(value);
    if (formatString !== null) {
      const formatErrors = formatString.validate(scopeType);
      if (this.recordReferences) {
        const validations = formatString.validateAndReturnRecordings(scopeType);
        for (let i = 0; i < validations.length; i++) {
          this.fieldReferences.push(validations[i]);
        }
      }
      let myErrorHandler = this.errorHandler;
      formatErrors.forEach(function (error) {
        myErrorHandler.pushError(
          attributeValuePosition(element, attribute, error.start, error.end),
          error.message,
          error.type
        );
      });
    }
    return formatString;
  }

  formatText(element: XMLElement, scopeType: Type) {
    const value = element.textContent;
    const formatString = evaluator.formatString(value);
    if (formatString !== null && scopeType !== null) {
      const formatErrors = formatString.validate(scopeType);
      if (this.recordReferences) {
        const validations = formatString.validateAndReturnRecordings(scopeType);
        for (let i = 0; i < validations.length; i++) {
          this.fieldReferences.push(validations[i]);
        }
      }
      let myErrorHandler = this.errorHandler;
      formatErrors.forEach(function (error) {
        myErrorHandler.pushError(elementTextPosition(element, error.start, error.end), error.message, error.type);
      });
    }
    return formatString;
  }

  displayFormat(element: XMLElement, component: Component) {
    var display;
    var displayAttribute = getAttribute(element, 'display');
    if (displayAttribute !== null) {
      var formatType = component.collectionType && (component.collectionType as QueryType).objectType;
      display = this.format(element, 'display', formatType);
    }
    return display;
  }
}
