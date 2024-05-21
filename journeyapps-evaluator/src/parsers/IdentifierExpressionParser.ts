import { isIdentifier, isLabeledStatement, Identifier, Node } from '@babel/types';
import { FormatShorthandTokenExpression, ShorthandTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, AbstractExpressionParserFactory } from './AbstractExpressionParser';

export class IdentifierExpressionParser extends AbstractExpressionParser<Identifier, ShorthandTokenExpression> {
  parse(): ShorthandTokenExpression {
    const { node } = this;
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

export class IdentifierExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isIdentifier(node)) {
      return new IdentifierExpressionParser({ node });
    }
    return null;
  }
}
