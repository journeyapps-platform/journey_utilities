import * as babelParser from '@babel/parser';
import traverse, { Node } from '@babel/traverse';
import {
  isBlockStatement,
  isCallExpression,
  isConditionalExpression,
  isDirectiveLiteral,
  isExpressionStatement,
  isIdentifier,
  isLabeledStatement,
  isLiteral,
  isMemberExpression,
  isProgram,
  isStringLiteral
} from '@babel/types';
import {
  ConstantTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpression
} from './token-expressions';

export class TokenExpressionParser {
  options: babelParser.ParserOptions;
  constructor() {
    this.options = { sourceType: 'script' };
  }

  compile(source: string): TokenExpression[] {
    const result = [];
    const ast = babelParser.parse(source);
    traverse(ast, {
      shouldSkip: (path) => {
        // We only walk the first node after Program and skip any nodes that have already been parsed, i.e. has a parent set
        // File -> Program -> Node
        return path.getAncestry().length > 3 || path.node.extra?.parent != null;
      },
      enter: (path) => {
        const { node } = path;
        node.extra = { ...node.extra, parent: path.parent };
        const parsed = result.push(TokenExpressionParser.nodeToTokenExpression(node, source));
      }
    });
    return result.filter((r) => r != null);
  }

  static nodeToTokenExpression(node: Node, source: string): TokenExpression | null {
    if (isProgram(node)) {
      return null;
    }
    if (isLiteral(node) || isDirectiveLiteral(node)) {
      if (isStringLiteral(node) || isDirectiveLiteral(node)) {
        return new ConstantTokenExpression(node.value);
      } else if ('value' in node) {
        return new PrimitiveConstantTokenExpression(`${node.value}`);
      }
    }
    if (isIdentifier(node)) {
      // Our `$:` syntax is parsed as a `LabeledStatement` with
      // `$` parsed as an `Identifier` which we skip
      if (isLabeledStatement(node.extra?.parent as Node)) {
        return null;
      }
      return new ShorthandTokenExpression(node.name, node.start);
    }
    if (isCallExpression(node)) {
      return new FunctionTokenExpression(source.slice(node.start, node.end)!);
    }
    if (isMemberExpression(node)) {
      return new ShorthandTokenExpression(source.slice(node.start, node.end)!);
    }
    if (isBlockStatement(node)) {
      // If parent is also a BlockStatement means we have an escaped FormatString, e.g. {{value}}
      // and it will be handled by `ExpressionStatement` lower down
      if (isBlockStatement(node.extra?.parent as Node)) {
        return null;
      }
      const body = node.body[0];
      if (isBlockStatement(body)) {
        return new ConstantTokenExpression(source.slice(body.start, body.end));
      }
      if (isLabeledStatement(body)) {
        // Example `{$:foo()}`
        const { body: child } = body;
        child.extra = { ...child.extra, parent: node };
        return TokenExpressionParser.nodeToTokenExpression(child, source);
      }
      if (isExpressionStatement(body)) {
        const { expression } = body;
        expression.extra = { ...expression.extra, parent: node };
        return TokenExpressionParser.nodeToTokenExpression(expression, source);
      }
    }
    if (isConditionalExpression(node)) {
      const { test, consequent, alternate } = node;
      const expression = `(function(test, consequent, alternate) { return test ? consequent : alternate; })(${source.slice(
        test.start,
        test.end
      )}, ${source.slice(consequent.start, consequent.end)}, ${source.slice(alternate.start, alternate.end)})`;
      return new FunctionTokenExpression(expression);
    }
    if (isExpressionStatement(node)) {
      const { expression } = node;
      expression.extra = { ...expression.extra, parent: node };
      return TokenExpressionParser.nodeToTokenExpression(expression, source);
    }
    return null;
  }
}
