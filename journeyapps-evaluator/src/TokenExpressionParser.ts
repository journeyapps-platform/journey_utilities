import * as babelParser from '@babel/parser';
import traverse, { Node } from '@babel/traverse';
import {
  BlockStatement,
  ConditionalExpression,
  isAssignmentExpression,
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
 * NOTE: only matches format specifiers that are in block statements, i.e. `{ }`
 */
const MATCH_FORMAT_SPECIFIER = /(?<!['"])(?<!\{)\{[^{}]*[^\$](:(\.?\d+f?))(?=[ }])[^{}]*\}(?!\})(?!['"])/gm;

export class TokenExpressionParser {
  static FORMAT_SPECIFIER_IDENTIFIER = '$format';
  options: babelParser.ParserOptions;
  constructor() {
    this.options = { sourceType: 'script', errorRecovery: true };
  }

  private preprocess(input: string): string {
    // Preprocess format specifiers
    return input.replace(MATCH_FORMAT_SPECIFIER, (match, group1, group2) => {
      return match.replace(group1, `; ${TokenExpressionParser.FORMAT_SPECIFIER_IDENTIFIER} = "${group2}"`);
    });
  }

  parse(source: string): TokenExpression[] {
    const result = [];
    const preprocessed = this.preprocess(source);
    try {
      const ast = babelParser.parse(preprocessed, this.options);
      traverse(ast, {
        shouldSkip: (path) => {
          // We only walk the first node after Program and skip any nodes that have already been parsed, i.e. has a parent set
          // File -> Program -> Node
          return path.getAncestry().length > 3 || path.node.extra?.parent != null;
        },
        enter: (path) => {
          const { node } = path;
          node.extra = { ...node.extra, parent: path.parent };
          result.push(this.nodeToTokenExpression(node, source));
        }
      });
    } catch (e) {
      console.error(e);
    }
    return result.filter((r) => r != null);
  }

  nodeToTokenExpression(node: Node, source: string): TokenExpression | null {
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
      return new FunctionTokenExpression(source.slice(node.start, node.end)!);
    }
    if (isBlockStatement(node)) {
      return this.parseBlockStatement(node, source);
    }
    if (isConditionalExpression(node)) {
      return this.parseConditionalExpression(node, source);
    }
    if (isExpressionStatement(node)) {
      const { expression } = node;
      expression.extra = { ...expression.extra, parent: node };
      return this.nodeToTokenExpression(expression, source);
    }
    return null;
  }

  parseBlockStatement(node: BlockStatement, source: string): TokenExpression {
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

  parseConditionalExpression(node: ConditionalExpression, source: string): TokenExpression {
    const { test, consequent, alternate } = node;
    const args = [
      source.slice(test.start, test.end),
      source.slice(consequent.start, consequent.end),
      source.slice(alternate.start, alternate.end)
    ];
    const expression = `(function(test, consequent, alternate) { return test ? consequent : alternate; })(${args.join(
      ', '
    )})`;
    return new FunctionTokenExpression(expression);
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
