import { DirectiveLiteral, isDirectiveLiteral, isStringLiteral, Literal } from '@babel/types';

import { ConstantTokenExpression, PrimitiveConstantTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export type LiteralExpression = Literal | DirectiveLiteral;

export class LiteralExpressionParser extends AbstractExpressionParser<LiteralExpression, ConstantTokenExpression> {
  parse(event: ExpressionNodeEvent<LiteralExpression>) {
    const { node } = event;
    if (isStringLiteral(node) || isDirectiveLiteral(node)) {
      return new ConstantTokenExpression(node.value);
    } else if ('value' in node) {
      return new PrimitiveConstantTokenExpression(node.value);
    }
  }
}

export class LiteralExpressionParserFactory extends ExpressionParserFactory<LiteralExpressionParser> {
  constructor() {
    super(['Literal', 'DirectiveLiteral']);
  }

  getParser() {
    return new LiteralExpressionParser();
  }
}
