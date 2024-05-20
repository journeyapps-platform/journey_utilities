import * as babelParser from '@babel/parser';
import traverse, { Node } from '@babel/traverse';
import {
  ConditionalExpression,
  isAssignmentExpression,
  isBlockStatement,
  isCallExpression,
  isConditionalExpression,
  isDirective,
  isDirectiveLiteral,
  isExpressionStatement,
  isIdentifier,
  isLabeledStatement,
  isLiteral,
  isMemberExpression,
  isStringLiteral,
  Statement
} from '@babel/types';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpression
} from './token-expressions';

/**
 * Matches format specifiers in expressions in the form of `{value:n}`, `{value:0n}` or `{value:.Xf}`
 * NOTE: only matches format specifiers that are inside a block statement
 */
const MATCH_FORMAT_SPECIFIER = /(?<!['"])(?<!\{)\{[^{}]*[^\$](:(\.?\d+f?))(?=[ }])[^{}]*\}(?!\})(?!['"])/gm;

export class TokenExpressionParser {
  static FORMAT_SPECIFIER_IDENTIFIER = '$format';

  private preprocess(input: string): string {
    // Preprocess format specifiers
    return input.replace(MATCH_FORMAT_SPECIFIER, (match, group1, group2) => {
      return match.replace(group1, `; ${TokenExpressionParser.FORMAT_SPECIFIER_IDENTIFIER} = "${group2}"`);
    });
  }

  parse<T extends TokenExpression = TokenExpression>(source: string): T | null {
    let result: TokenExpression | null = null;
    const preprocessed = this.preprocess(source);
    try {
      const ast = babelParser.parse(preprocessed);
      traverse(ast, {
        Program: (path) => {
          const node = path.node.body[0] ?? path.node.directives[0];
          result = this.nodeToTokenExpression(node, source);
        }
      });
    } catch (e) {
      console.error(e);
    }
    return result as T;
  }

  nodeToTokenExpression(node: Node, source: string): TokenExpression | null {
    if (isLiteral(node) || isDirectiveLiteral(node)) {
      if (isStringLiteral(node) || isDirectiveLiteral(node)) {
        return new ConstantTokenExpression(node.value);
      } else if ('value' in node) {
        return new PrimitiveConstantTokenExpression(node.value);
      }
    }
    if (isIdentifier(node)) {
      // Our `$:` syntax is parsed as a `LabeledStatement` with
      // `$` parsed as an `Identifier` which we skip
      if (isLabeledStatement(node.extra?.parent as Node)) {
        return null;
      }
      if (node.extra?.format) {
        return new FormatShorthandTokenExpression(node.name, node.extra?.format as string, node.start);
      }
      return new ShorthandTokenExpression(node.name, node.start);
    }
    if (isMemberExpression(node)) {
      const exp = source.slice(node.start, node.end);
      if (node.extra?.format) {
        return new FormatShorthandTokenExpression(exp, node.extra?.format as string, node.start);
      }
      return new ShorthandTokenExpression(exp);
    }
    if (isCallExpression(node)) {
      const name = source.slice(node.callee.start, node.callee.end);
      const args = node.arguments.map((arg) => this.nodeToTokenExpression(arg, source));
      return new FunctionTokenExpression(source.slice(node.start, node.end), { name: name, arguments: args });
    }
    if (isConditionalExpression(node)) {
      return this.parseConditionalExpression(node, source);
    }
    if (isBlockStatement(node)) {
      // If parent is also a BlockStatement means we have an escaped FormatString, e.g. {{value}}
      // and it will be handled by `ExpressionStatement` lower down
      if (isBlockStatement(node.extra?.parent as Node)) {
        return null;
      }
      const [body, formatStm] = node.body;
      if (isBlockStatement(body)) {
        return new ConstantTokenExpression(source.slice(body.start, body.end));
      }
      if (isLabeledStatement(body)) {
        // Example `{$:foo()}`
        const { body: child } = body;
        child.extra = { ...child.extra, parent: node };
        return this.nodeToTokenExpression(child, source);
      }
      if (isExpressionStatement(body)) {
        const { expression } = body;
        expression.extra = { ...expression.extra, parent: node, format: this.getFormatSpecifier(formatStm) };
        return this.nodeToTokenExpression(expression, source);
      }
    }
    if (isLabeledStatement(node)) {
      const { body: child } = node;
      child.extra = { ...child.extra, parent: node };
      return this.nodeToTokenExpression(child, source);
    }
    if (isDirective(node)) {
      const { value: child } = node;
      child.extra = { ...child.extra, parent: node };
      return this.nodeToTokenExpression(child, source);
    }
    if (isExpressionStatement(node)) {
      const { expression } = node;
      expression.extra = { ...expression.extra, parent: node };
      return this.nodeToTokenExpression(expression, source);
    }
    return null;
  }

  parseConditionalExpression(node: ConditionalExpression, source: string): TokenExpression {
    const { test, consequent, alternate } = node;
    const args = [test, consequent, alternate].map((arg) => this.nodeToTokenExpression(arg, source));
    const argStrings = [
      source.slice(test.start, test.end),
      source.slice(consequent.start, consequent.end),
      source.slice(alternate.start, alternate.end)
    ];
    const expression = `(function(test, consequent, alternate) { return test ? consequent : alternate; })(${argStrings.join(
      ', '
    )})`;
    return new FunctionTokenExpression(expression, { arguments: args });
  }

  getFormatSpecifier(stm: Statement | null): string {
    if (!isExpressionStatement(stm)) {
      return;
    }
    const { expression } = stm;
    if (!isAssignmentExpression(expression)) {
      return;
    }
    return isStringLiteral(expression.right) ? expression.right.value : null;
  }
}
