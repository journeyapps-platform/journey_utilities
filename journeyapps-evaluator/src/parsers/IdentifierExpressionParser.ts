import { isLabeledStatement, Identifier, Node } from '@babel/types';
import { FormatShorthandTokenExpression, ShorthandTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export class IdentifierExpressionParser extends AbstractExpressionParser<Identifier, ShorthandTokenExpression> {
  parse(event: ExpressionNodeEvent<Identifier>): ShorthandTokenExpression {
    const { node } = event;
    // Our `$:` syntax is parsed as a `LabeledStatement` with
    // `$` parsed as an `Identifier` which we skip
    if (isLabeledStatement(node.extra?.parent as Node)) {
      return null;
    }
    if (node.extra?.format) {
      return new FormatShorthandTokenExpression(node.name, {
        format: node.extra?.format as string
      });
    }
    return new ShorthandTokenExpression(node.name);
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
