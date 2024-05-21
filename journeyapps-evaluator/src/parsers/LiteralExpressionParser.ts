import { DirectiveLiteral, Literal, isLiteral, isDirectiveLiteral, isStringLiteral, Node } from '@babel/types';

import { ConstantTokenExpression, PrimitiveConstantTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, AbstractExpressionParserFactory } from './AbstractExpressionParser';

export type LiteralExpression = Literal | DirectiveLiteral;

export class LiteralExpressionParser extends AbstractExpressionParser<LiteralExpression, ConstantTokenExpression> {
  parse() {
    const { node } = this;
    if (isStringLiteral(node) || isDirectiveLiteral(node)) {
      return new ConstantTokenExpression(node.value);
    } else if ('value' in node) {
      return new PrimitiveConstantTokenExpression(node.value);
    }
  }
}

export class LiteralExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isLiteral(node) || isDirectiveLiteral(node)) {
      return new LiteralExpressionParser({ node: node });
    }
    return null;
  }
}
