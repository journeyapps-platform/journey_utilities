import * as babelParser from '@babel/parser';
import traverse, { Node } from '@babel/traverse';
import {
  isLiteral,
  isProgram,
  isExpressionStatement,
  isDirectiveLiteral,
  isIdentifier,
  isCallExpression,
  isMemberExpression,
  isBlockStatement,
  isLabeledStatement
} from '@babel/types';
import {
  ConstantTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression,
  ShorthandTokenExpression,
  TokenExpression
} from './token-expressions';

export class ExpressionParser {
  options: babelParser.ParserOptions;
  constructor() {
    this.options = { sourceType: 'script' };
  }

  compile(source: string): TokenExpression[] {
    const result = [];
    const ast = babelParser.parse(source);
    traverse(ast, {
      shouldSkip: (path) => {
        return path.getAncestry().length > 3;
      },
      enter: (path) => {
        const { node } = path;
        node.extra = { ...node.extra, parent: path.parent };
        result.push(...ExpressionParser.nodeToTokenExpression(node, source));
      }
    });
    console.log('result', result);
    return result;
  }

  static nodeToTokenExpression(node: Node, source: string): TokenExpression[] {
    if (isProgram(node)) {
      return [];
    }
    if (isLiteral(node) || isDirectiveLiteral(node)) {
      if (node.type === 'StringLiteral' || node.type === 'DirectiveLiteral') {
        return [new ConstantTokenExpression(node.value, node.start)];
      } else if ('value' in node) {
        return [new PrimitiveConstantTokenExpression(`${node.value}`, node.start)];
      }
    }
    if (isIdentifier(node)) {
      if (!isLabeledStatement(node.extra?.parent as Node)) {
        return [new ShorthandTokenExpression(node.name, node.start)];
      }
    }
    if (isCallExpression(node)) {
      return [new FunctionTokenExpression(source.slice(node.start, node.end)!, node.start)];
    }
    if (isMemberExpression(node)) {
      return [new ShorthandTokenExpression(source.slice(node.start, node.end)!, node.start)];
    }
    if (isBlockStatement(node)) {
      if (isBlockStatement(node.extra?.parent as Node)) {
        return [];
      }
      const body = node.body[0];
      if (isBlockStatement(body)) {
        return [new ConstantTokenExpression(source.slice(body.start, body.end), node.start)];
      }
      if (isLabeledStatement(body)) {
        return [...ExpressionParser.nodeToTokenExpression(body.body, source)];
      }
    }
    if (isExpressionStatement(node)) {
      return [...ExpressionParser.nodeToTokenExpression(node.expression, source)];
    }

    return [];
  }

  // static nodeToTokenExpressions(node: Node): TokenExpression[] {
  //   switch (node.type) {
  //     case 'Literal':
  //       const val = (node as Literal).value;
  //       if (typeof val === 'string') {
  //         return [new ConstantTokenExpression(val, node.start)];
  //       } else {
  //         return [new PrimitiveConstantTokenExpression(`${val}`, node.start)];
  //       }
  //     case 'CallExpression':
  //       return [new FunctionTokenExpression(ExpressionParser.nodeToString(node), node.start)];
  //     case 'Identifier':
  //     case 'MemberExpression': {
  //       const format = (node as any).format;
  //       if (!!format) {
  //         return [new FormatShorthandTokenExpression(ExpressionParser.nodeToString(node), format, node.start)];
  //       } else {
  //         return [new ShorthandTokenExpression(ExpressionParser.nodeToString(node), node.start)];
  //       }
  //     }
  //     case 'BlockStatement': {
  //       const body = (node as BlockStatement).body[0];
  //       if (!body) {
  //         return [];
  //       }
  //       if (body.type == 'BlockStatement') {
  //         return [new ConstantTokenExpression(ExpressionParser.nodeToString(body), node.start)];
  //       }
  //       return ExpressionParser.nodeToTokenExpressions(body);
  //     }
  //     case 'ExpressionStatement':
  //       return ExpressionParser.nodeToTokenExpressions((node as ExpressionStatement).expression);
  //     default: {
  //       console.log(node);
  //     }
  //   }
  //   return [];
  // }
  //
  // static nodeToString(node: Node): string {
  //   switch (node.type) {
  //     case 'Literal': {
  //       return `${(node as Literal).raw}`;
  //     }
  //     case 'Identifier': {
  //       return (node as Identifier).name;
  //     }
  //     case 'Property': {
  //       const prop = node as Property;
  //       return `${ExpressionParser.nodeToString(prop.key)}: ${ExpressionParser.nodeToString(prop.value)}`;
  //     }
  //     case 'ObjectExpression': {
  //       return `{${(node as ObjectExpression).properties
  //         .map((property) => ExpressionParser.nodeToString(property))
  //         .join(', ')}}`;
  //     }
  //     case 'MemberExpression': {
  //       const exp = node as MemberExpression;
  //       return `${ExpressionParser.nodeToString(exp.object)}.${ExpressionParser.nodeToString(exp.property)}`;
  //     }
  //     case 'FunctionExpression': {
  //       const exp = node as FunctionExpression;
  //       return `(function (${exp.params
  //         .map((param) => ExpressionParser.nodeToString(param))
  //         .join(', ')})${ExpressionParser.nodeToString(exp.body)})`;
  //     }
  //     case 'CallExpression': {
  //       const exp = node as CallExpression;
  //       return `${ExpressionParser.nodeToString(exp.callee)}(${exp.arguments
  //         .map((arg) => ExpressionParser.nodeToString(arg))
  //         .join(', ')})`;
  //     }
  //     default: {
  //       return (node as any).sourceFile.substring(node.start, node.end);
  //     }
  //   }
  // }
}

// function JourneyFormatParser() {
//   return function (Parser) {
//     return class extends Parser {
//       eat(type: TokenType) {
//         // Eats Format Specifier start token `:`
//         if (type == tokTypes.colon && this.type == type && this.curContext().isExpr == false) {
//           return false;
//         }
//         return super.eat(type);
//       }
//       readToken(code: number) {
//         const ch = this.input.charCodeAt(this.pos);
//         // $:
//         if (ch === 36 && this.input.charCodeAt(this.pos + 1) === 58) {
//           this.pos += 2;
//           return this.next();
//         }
//         return super.readToken(code);
//       }
//       readFormat() {
//         const chunkStart = this.pos;
//         if (this.pos == this.input.length) {
//           this.raise(this.start, "Expected format specifier after ':'");
//         }
//         for (;;) {
//           let ch = this.input.charCodeAt(this.pos);
//           // '}'
//           if (ch == 125 || this.pos == this.input.length) {
//             const out = this.input.slice(chunkStart, this.pos);
//             this.finishToken(tokTypes.semi, out);
//             return out;
//           }
//           ++this.pos;
//         }
//       }
//       parseExpressionStatement(node: Node, expr: Expression & { format?: string }) {
//         // check for FormatSpecifier
//         if (this.type == tokTypes.colon) {
//           expr.format = this.readFormat();
//         }
//         return super.parseExpressionStatement(node, expr);
//       }
//     };
//   };
// }
