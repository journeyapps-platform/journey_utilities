import { View } from '../app';
import * as evaluator from '@journeyapps/evaluator';
import { Hideable } from '../app/view';
import { TypeInterface } from '@journeyapps/evaluator';
import { ParseErrors } from '@journeyapps/parser-common';
import { SchemaParser, parseJsonVariable } from '@journeyapps/parser-schema';
import { linkElement, argElement } from '../app/viewParser';
import { XMLElement } from '@journeyapps/domparser/types';
import * as xml from '@journeyapps/core-xml';

const { getAttribute } = xml;

export const checkForBooleanToPrimitive = (value: string): evaluator.PrimitiveConstantTokenExpression | string => {
  if (value === 'true' || value === 'false') {
    return new evaluator.PrimitiveConstantTokenExpression(value === 'true');
  }
  return value;
};

export function parseElement(element: XMLElement, definitions: any, errorHandler: ParseErrors) {
  const result = xml.parseElement(element, definitions);
  if (result.errors.length > 0) {
    errorHandler.pushErrors(result.errors);
  }
  return result;
}

export function parseShowHide(
  element: XMLElement,
  component: Hideable,
  scopeType: TypeInterface,
  errorHandler: ParseErrors
) {
  ['show-if', 'hide-if'].forEach((prop) => {
    let value = getAttribute(element, prop);
    if (value) {
      let resolvedValue = checkForBooleanToPrimitive(value);
      (component as any)[dashToCamelCase(prop)] = resolvedValue;
      validateBinding(element, prop, true, scopeType, errorHandler);
    }
  });
}

export function parseVariables(root: XMLElement, view: View, schemaParser: SchemaParser, errorHandler: ParseErrors) {
  // Variables and parameters

  var variables = xml.children(root, 'var,param');
  variables.forEach(function (element) {
    var variable = schemaParser.parseField(element, true);
    errorHandler.pushErrors(schemaParser.getErrors());
    schemaParser.reset();

    if (view.type.attributes.hasOwnProperty(variable.name)) {
      var errorHandlerorElement = xml.attributeNode(element, 'name') || element;
      errorHandler.pushError(errorHandlerorElement, "Variable '" + variable.name + "' is already defined");
    } else {
      if (variable.type != null) {
        // If the type cannot be resolved, we pretend the variable doesn't exist at all.
        // The actual errorHandleror will be reported from the loadElement method.
        view.type.addAttribute(variable);
        if (element.tagName == 'param') {
          view.parameters.push(variable);
        }
      }
    }
  });
}

export function validateViewElementOrder(
  root: XMLElement,
  allowedViewElements: { [tag: string]: number },
  errorHandler: ParseErrors
) {
  errorHandler.pushErrors(
    xml.validateChildren(
      root,
      allowedViewElements,
      'Elements must be in this order: parameters, variables, links, components'
    )
  );
}

export function inferOnPress(onPress: string, view: View) {
  const LINK_TYPE_MAP: { [key: string]: string } = {
    link: 'normal',
    dismiss: 'dismiss'
  };
  const LINK_INFER = /(link|dismiss)\.([\w\.]+)/;
  if (onPress == null) {
    return;
  }
  var match = LINK_INFER.exec(onPress);
  if (match == null) {
    return;
  }
  var type = LINK_TYPE_MAP[match[1]];
  // Replace dots with slashes
  var path = match[2].split('.').join('/');

  view.addInferredLink({
    type: type,
    path: path,
    inferred: true
  });
}

export function parseLinks(root: XMLElement, view: View, errorHandler: ParseErrors) {
  var links = xml.children(root, 'link');
  links.forEach(function (element) {
    parseElement(element, linkElement, errorHandler);

    errorHandler.pushErrors(xml.validateChildren(element, { arg: 1 }));

    var link = {
      path: getAttribute(element, 'path'),
      name: getAttribute(element, 'name'),
      args: [] as string[],
      ondismiss: getAttribute(element, 'ondismiss'),
      type: getAttribute(element, 'type')
    };
    if (link.type == null) {
      link.type = 'normal';
    }
    xml.children(element, 'arg').forEach(function (arge) {
      parseElement(arge, argElement, errorHandler);

      link.args.push(getAttribute(arge, 'bind'));
    });
    if (view.links.hasOwnProperty(link.name)) {
      var errorHandlerorElement = xml.attributeNode(element, 'name') || element;
      errorHandler.pushError(errorHandlerorElement, "Link '" + link.name + "' is already defined");
    } else {
      view.addLink(link);
    }
  });
}

/**
 * @param element
 * @param {string} attr
 * @param {boolean} [allowFunctionBinding=false] if function bindings are allowed (defaults to false)
 */
export function validateBinding(
  element: XMLElement,
  attr: string,
  allowFunctionBinding: boolean,
  scopeType: TypeInterface,
  errorHandler: ParseErrors
) {
  if (typeof allowFunctionBinding === 'undefined' || allowFunctionBinding == null) {
    allowFunctionBinding = false;
  }
  var binding = getAttribute(element, attr);
  // TODO: somehow handle this automatically with getType.
  if (binding == null || ['null', 'true', 'false'].indexOf(binding) >= 0) {
    return;
  }
  if (allowFunctionBinding) {
    var token = evaluator.functionTokenExpression(binding, false);
    if (token != null) {
      // binding is a function token expression
      // TODO: validate that the function exists in the view (not done for `onpress` currently)
      return;
    }
  }
  var bindingType = scopeType.getType(binding);
  if (bindingType == null) {
    errorHandler.pushError(xml.attributeNode(element, attr), 'Undefined variable ' + binding);
  }
}

export function jsonParser(view: View) {
  function parse(data: any) {
    var name;

    view.onBack = data.onBack;
    view.onNavigate = data.onNavigate;

    for (name in data.variables) {
      var varData = data.variables[name];
      var variable = parseJsonVariable(view.schema, name, varData);
      view.type.addAttribute(variable);
    }

    data.parameters.forEach(function (param: string) {
      view.parameters.push(view.type.getVariable(param));
    });

    for (name in data.links) {
      var link = data.links[name];
      view.addLink(link);
    }

    return view;
  }

  return {
    parse
  };
}

export function dashToCamelCase(key: string) {
  return key.replace(/(\-\w)/g, function (m) {
    return m[1].toUpperCase();
  });
}

export function isRawTokenFunctionExpression(value: any) {
  return value != null && typeof value == 'string' && value.startsWith('$:');
}
