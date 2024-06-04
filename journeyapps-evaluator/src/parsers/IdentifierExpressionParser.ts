import { isLabeledStatement, Identifier, Node } from '@babel/types';
import { FunctionExpressionContext } from '../context/FunctionExpressionContext';
import {
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  ShorthandTokenExpression
} from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export type ParsedIdentifierExpressionType =
  | FunctionTokenExpression
  | ShorthandTokenExpression
  | FormatShorthandTokenExpression;

export class IdentifierExpressionParser extends AbstractExpressionParser<Identifier, ParsedIdentifierExpressionType> {
  parse(event: ExpressionNodeParseEvent<Identifier>) {
    const { node, context } = event;
    if (isLabeledStatement(node.extra?.parent as Node)) {
      return null;
    }
    const { name: expression } = node;
    if (FunctionExpressionContext.isInstanceOf(context)) {
      return new FunctionTokenExpression({
        expression: expression,
        isShorthand: true
      });
    }
    const format = node.extra?.format as string;
    return format != null
      ? new FormatShorthandTokenExpression({ expression: expression, format: format })
      : new ShorthandTokenExpression({ expression: expression });
  }
}

export class IdentifierExpressionParserFactory extends ExpressionParserFactory<IdentifierExpressionParser> {
  constructor() {
    super('Identifier');
  }

  getParser() {
    return new IdentifierExpressionParser();
  }
}
