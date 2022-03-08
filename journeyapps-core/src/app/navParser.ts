import * as xml from '@journeyapps/core-xml';
import { Component } from './view';
import { ComponentParseEvent, ParseErrors } from '@journeyapps/parser-common';
import { Type } from '@journeyapps/parser-schema';
import { FormatString } from '@journeyapps/evaluator';
import { Formatter } from '../util/Formatter';
import { checkForBooleanToPrimitive, parseElement, validateBinding } from '../util/parserUtils';
import { XMLElement } from '@journeyapps/domparser/types';

export function parse(xmlString: string, options?: { componentBank?: any }) {
  const xmlDoc = xml.parse(xmlString);
  if ((xmlDoc.errors || []).length > 0) {
    // Fail fast with invalid XML issues
    return {
      errors: xmlDoc.errors
    };
  }
  const navigationElement = xmlDoc.documentElement;
  // We use this parser exclusively for <navigation />
  const type = 'navigation';
  // Some common properties
  let component: object = {
    type
  };

  let fieldReferences: {
    type: string;
    isPrimitiveType: boolean;
    name: string;
  }[][] = [];
  var recordReferences = false;
  let errorHandler = new ParseErrors();
  const fmt = new Formatter(errorHandler, recordReferences, fieldReferences);

  if (options.componentBank) {
    let parser = options.componentBank.getComponent(type);
    if (parser) {
      const event = new ComponentParseEvent();
      event.component = component;
      event.element = navigationElement;
      event.helper = {
        checkForBooleanToPrimitive: (val) => {
          return checkForBooleanToPrimitive(val);
        },
        formatAttribute(element: XMLElement, value: string, scopeType: Type): FormatString | null {
          return fmt.format(element, value, scopeType, true);
        },
        inferOnPress(onPress: string): any {
          console.log('inferOnPress not implemented!');
        },
        pushError(element: xml.XMLPositional, message: string, type?: xml.ErrorType): void {
          errorHandler.pushError(element, message, type);
        },
        formatContent(element: XMLElement, scopeType: Type): FormatString | null {
          return fmt.formatText(element, scopeType);
        },
        parseComponent(element: XMLElement, scopeType: Type): Component {
          // Not important as it's only used by compZone.
          return null;
        },
        parseElement(element: XMLElement, definitions: any) {
          return parseElement(element, definitions, errorHandler);
        },
        validateBinding: (element: XMLElement, attr: string, allowFunctionBinding: boolean, scopes: Type) => {
          validateBinding(element, attr, allowFunctionBinding, scopes, errorHandler);
        }
      };
      // Do the parsing:
      parser.parse(event);
      return {
        component,
        errors: errorHandler.getErrors()
      };
    }
  }
}
