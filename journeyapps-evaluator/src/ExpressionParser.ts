import {
  Parser as AcornParser,
  Expression,
  Literal,
  Identifier,
  Node,
  CallExpression,
  ObjectExpression,
  Property,
  MemberExpression,
  FunctionExpression,
  tokTypes,
  TokenType,
  BlockStatement,
  ExpressionStatement,
  Options
} from 'acorn';
import { fullAncestor as walk } from 'acorn-walk';
import {
  ConstantTokenExpression,
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpression
} from './token-expressions';

export class ExpressionParser {
  private parser: typeof AcornParser;
  options: Options;
  constructor(options: Partial<Options> = {}) {
    this.options = {
      sourceType: 'script',
      ecmaVersion: 2017,
      ...options
    };
    this.parser = AcornParser.extend(JourneyFormatParser() as any);
  }

  compile(source: string): TokenExpression[] {
    const result: TokenExpression[] = [];

    walk(this.parser.parse(source, { ...this.options, directSourceFile: source }), (node, _, ancestors) => {
      if (ancestors.length == 2) {
        result.push(...ExpressionParser.nodeToTokenExpressions(node));
      }
    });
    console.log('result', result);
    return result;
  }

  parseExpressionAt(source: string, index: number): Expression {
    return this.parser.parseExpressionAt(source, index, { ...this.options, directSourceFile: source });
  }

  static nodeToTokenExpressions(node: Node): TokenExpression[] {
    switch (node.type) {
      case 'Literal':
        const val = (node as Literal).value;
        if (typeof val === 'string') {
          return [new ConstantTokenExpression(val, node.start)];
        } else {
          return [new PrimitiveConstantTokenExpression(`${val}`, node.start)];
        }
      case 'CallExpression':
        return [new FunctionTokenExpression(ExpressionParser.nodeToString(node), node.start)];
      case 'Identifier':
      case 'MemberExpression': {
        const format = (node as any).format;
        if (!!format) {
          return [new FormatShorthandTokenExpression(ExpressionParser.nodeToString(node), format, node.start)];
        } else {
          return [new ShorthandTokenExpression(ExpressionParser.nodeToString(node), node.start)];
        }
      }
      case 'BlockStatement': {
        const body = (node as BlockStatement).body[0];
        if (!body) {
          return [];
        }
        if (body.type == 'BlockStatement') {
          return [new ConstantTokenExpression(ExpressionParser.nodeToString(body), node.start)];
        }
        return ExpressionParser.nodeToTokenExpressions(body);
      }
      case 'ExpressionStatement':
        return ExpressionParser.nodeToTokenExpressions((node as ExpressionStatement).expression);
      default: {
        console.log(node);
      }
    }
    return [];
  }

  static nodeToString(node: Node): string {
    switch (node.type) {
      case 'Literal': {
        return `${(node as Literal).raw}`;
      }
      case 'Identifier': {
        return (node as Identifier).name;
      }
      case 'Property': {
        const prop = node as Property;
        return `${ExpressionParser.nodeToString(prop.key)}: ${ExpressionParser.nodeToString(prop.value)}`;
      }
      case 'ObjectExpression': {
        return `{${(node as ObjectExpression).properties
          .map((property) => ExpressionParser.nodeToString(property))
          .join(', ')}}`;
      }
      case 'MemberExpression': {
        const exp = node as MemberExpression;
        return `${ExpressionParser.nodeToString(exp.object)}.${ExpressionParser.nodeToString(exp.property)}`;
      }
      case 'FunctionExpression': {
        const exp = node as FunctionExpression;
        return `(function (${exp.params
          .map((param) => ExpressionParser.nodeToString(param))
          .join(', ')})${ExpressionParser.nodeToString(exp.body)})`;
      }
      case 'CallExpression': {
        const exp = node as CallExpression;
        return `${ExpressionParser.nodeToString(exp.callee)}(${exp.arguments
          .map((arg) => ExpressionParser.nodeToString(arg))
          .join(', ')})`;
      }
      default: {
        return (node as any).sourceFile.substring(node.start, node.end);
      }
    }
  }
}

function JourneyFormatParser() {
  return function (Parser) {
    return class extends Parser {
      eat(type: TokenType) {
        // Eats Format Specifier start token `:`
        if (type == tokTypes.colon && this.type == type && this.curContext().isExpr == false) {
          return false;
        }
        return super.eat(type);
      }
      readToken(code: number) {
        const ch = this.input.charCodeAt(this.pos);
        // $:
        if (ch === 36 && this.input.charCodeAt(this.pos + 1) === 58) {
          this.pos += 2;
          return this.next();
        }
        return super.readToken(code);
      }
      readFormat() {
        const chunkStart = this.pos;
        if (this.pos == this.input.length) {
          this.raise(this.start, "Expected format specifier after ':'");
        }
        for (;;) {
          let ch = this.input.charCodeAt(this.pos);
          // '}'
          if (ch == 125 || this.pos == this.input.length) {
            const out = this.input.slice(chunkStart, this.pos);
            this.finishToken(tokTypes.semi, out);
            return out;
          }
          ++this.pos;
        }
      }
      parseExpressionStatement(node: Node, expr: Expression & { format?: string }) {
        // check for FormatSpecifier
        if (this.type == tokTypes.colon) {
          expr.format = this.readFormat();
        }
        return super.parseExpressionStatement(node, expr);
      }
    };
  };
}
