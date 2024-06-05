import { DirectiveLiteral, isDirectiveLiteral, isStringLiteral, isNullLiteral, Literal } from '@babel/types';
import { FunctionExpressionContext } from '../context/FunctionExpressionContext';

import {
  ConstantTokenExpression,
  FunctionTokenExpression,
  PrimitiveConstantTokenExpression
} from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export type LiteralExpression = Literal | DirectiveLiteral;

export type ParsedLiteralExpressionType =
  | ConstantTokenExpression
  | FunctionTokenExpression
  | PrimitiveConstantTokenExpression;

export class LiteralExpressionParser extends AbstractExpressionParser<LiteralExpression, ParsedLiteralExpressionType> {
  parse(event: ExpressionNodeParseEvent<LiteralExpression>) {
    const { node, context } = event;
    const inFunctionContext = FunctionExpressionContext.isInstanceOf(context);
    if (isStringLiteral(node) || isDirectiveLiteral(node)) {
      if (inFunctionContext) {
        return new FunctionTokenExpression({ expression: `'${node.value}'` });
      }
      return new ConstantTokenExpression({ expression: node.value });
    }
    if (isNullLiteral(node)) {
      if (inFunctionContext) {
        return new FunctionTokenExpression({ expression: 'null' });
      }
      return new ConstantTokenExpression({ expression: 'null' });
    }
    if ('value' in node) {
      if (inFunctionContext) {
        return new FunctionTokenExpression({ expression: `${node.value}` });
      }
      return new PrimitiveConstantTokenExpression({ expression: node.value });
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
