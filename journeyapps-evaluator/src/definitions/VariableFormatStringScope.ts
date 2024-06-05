import { FormatStringScope } from './FormatStringScope';
import { TypeInterface } from './TypeInterface';
import { VariableScope } from './VariableScope';

export class VariableFormatStringScope implements FormatStringScope {
  variableScope: VariableScope;

  constructor(variableScope: VariableScope) {
    this.variableScope = variableScope;
  }

  getExpressionType(expression: string): TypeInterface {
    if (this.variableScope.type == null) {
      // Mostly for tests, which are too lazy to define this.
      return null;
    }
    return this.variableScope.type.getType(expression);
  }

  getValue(expression: string) {
    if (expression.length > 0 && expression[0] == '?') {
      expression = expression.substring(1);
    }
    return getValue(this.variableScope, expression);
  }

  getValuePromise(expression: string): Promise<any> {
    return getValuePromise(this.variableScope, expression);
  }

  evaluateFunctionExpression(expression: string): Promise<any> {
    throw new Error('Not supported');
  }
}

function getValue(scope: VariableScope, expression: string, depth?: number): any {
  if (depth == null) {
    depth = 0;
    if (expression == 'null') {
      return null;
    } else if (expression == 'true') {
      return true;
    } else if (expression == 'false') {
      return false;
    }
  }
  if (expression == null || scope == null) {
    return null;
  }

  const dot = expression.indexOf('.');
  if (dot < 0) {
    return cached(scope, expression);
  } else {
    const head = expression.substring(0, dot); // The first part of the expression
    const tail = expression.substring(dot + 1); // The rest of the expression

    const child = cached(scope, head);
    if (child === undefined) {
      return undefined;
    } else {
      return getValue(child, tail, depth + 1);
    }
  }
}

async function getValuePromise(scope: VariableScope, expression: string, depth?: number): Promise<any> {
  if (depth == null) {
    depth = 0;
    if (expression == 'null') {
      return null;
    } else if (expression == 'true') {
      return true;
    } else if (expression == 'false') {
      return false;
    }
  }
  if (expression == null || scope == null) {
    return null;
  } else if (typeof expression != 'string') {
    throw new Error('Expression must be a string got: ' + typeof expression);
  }

  const dot = expression.indexOf('.');
  if (dot < 0) {
    return promise(scope, expression);
  } else {
    const head = expression.substring(0, dot); // The first part of the expression
    const tail = expression.substring(dot + 1); // The rest of the expression

    return promise(scope, head).then(function (child: any) {
      return getValuePromise(child, tail, depth + 1);
    });
  }
}

function cached(scope: VariableScope, name: string): any {
  if (typeof scope._cached == 'function') {
    return scope._cached(name);
  } else {
    const val = scope[name];
    if (val === undefined) {
      return null;
    } else {
      return val;
    }
  }
}

async function promise(scope: VariableScope, name: string): Promise<any> {
  if (typeof scope._get == 'function') {
    // DatabaseObject
    return scope._get(name);
  } else {
    if (typeof scope[name] == 'function') {
      return scope[name]();
    } else {
      return scope[name];
    }
  }
}
