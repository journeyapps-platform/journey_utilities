import { Node, isIdentifier, isObjectExpression, isObjectProperty, ObjectExpression } from '@babel/types';
import { ObjectTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export class ObjectExpressionParser extends AbstractExpressionParser<ObjectExpression, ObjectTokenExpression> {
  parse(event: ExpressionNodeEvent): ObjectTokenExpression {
    const { node } = this;
    const { source, parseNode } = event;

    const props = {};
    for (const prop of node.properties) {
      if (isObjectProperty(prop) && isIdentifier(prop.key)) {
        props[prop.key.name] = parseNode(prop.value, source);
      }
    }

    return new ObjectTokenExpression(source.slice(node.start, node.end), { properties: props });
  }
}

export class ObjectExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isObjectExpression(node)) {
      return new ObjectExpressionParser({ node });
    }
    return null;
  }
}
