import { ArrayExpression } from '@babel/types';
import { ArrayTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionNodeParseEvent,
  ExpressionParserFactory
} from './AbstractExpressionParser';

export class ArrayExpressionParser extends AbstractExpressionParser<ArrayExpression, ArrayTokenExpression> {
  parse(event: ExpressionNodeParseEvent<ArrayExpression>): ArrayTokenExpression {
    const { node, source, parseNode } = event;

    const elements = node.elements.map((element) => parseNode({ node: element, source }));

    return new ArrayTokenExpression({
      expression: source.slice(node.start, node.end),
      elements: elements
    });
  }
}

export class ArrayExpressionParserFactory extends ExpressionParserFactory<ArrayExpressionParser> {
  constructor() {
    super('ArrayExpression');
  }

  getParser() {
    return new ArrayExpressionParser();
  }
}
