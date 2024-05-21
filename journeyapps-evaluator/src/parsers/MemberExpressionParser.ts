import { MemberExpression, isMemberExpression, Node } from '@babel/types';
import { FormatShorthandTokenExpression, ShorthandTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export class MemberExpressionParser extends AbstractExpressionParser<MemberExpression, ShorthandTokenExpression> {
  parse(event: ExpressionNodeEvent) {
    const { node } = this;
    const exp = event.source.slice(node.start, node.end);
    const format: string = node.extra?.format as string;
    if (!!format) {
      return new FormatShorthandTokenExpression(exp, { format: format });
    }
    return new ShorthandTokenExpression(exp);
  }
}

export class MemberExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isMemberExpression(node)) {
      return new MemberExpressionParser({ node });
    }
    return null;
  }
}
