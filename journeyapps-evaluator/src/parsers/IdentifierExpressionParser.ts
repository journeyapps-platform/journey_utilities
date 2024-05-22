import { isLabeledStatement, Identifier, Node } from '@babel/types';
import {
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  ShorthandTokenExpression
} from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';
import { inFunctionExpression } from './utils';

export type IdentifierExpressionParsedType =
  | FunctionTokenExpression
  | ShorthandTokenExpression
  | FormatShorthandTokenExpression;

export class IdentifierExpressionParser extends AbstractExpressionParser<Identifier, IdentifierExpressionParsedType> {
  parse(event: ExpressionNodeEvent<Identifier>) {
    const { node } = event;
    if (isLabeledStatement(node.extra?.parent as Node)) {
      return null;
    }
    const { name: expression } = node;
    if (inFunctionExpression(node)) {
      return new FunctionTokenExpression({ expression: expression });
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
