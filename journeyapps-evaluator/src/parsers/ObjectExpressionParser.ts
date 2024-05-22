import { Node, isIdentifier, isObjectExpression, isObjectProperty, ObjectExpression, isType } from '@babel/types';
import { ObjectTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export class ObjectExpressionParser extends AbstractExpressionParser<ObjectExpression, ObjectTokenExpression> {
  parse(event: ExpressionNodeEvent<ObjectExpression>): ObjectTokenExpression {
    const { node, source, parseNode } = event;

    const props = {};
    for (const prop of node.properties) {
      if (isObjectProperty(prop) && isIdentifier(prop.key)) {
        props[prop.key.name] = parseNode(prop.value, source);
      }
    }

    return new ObjectTokenExpression(source.slice(node.start, node.end), { properties: props });
  }
}

export class ObjectExpressionParserFactory extends ExpressionParserFactory<ObjectExpressionParser> {
  constructor() {
    super('ObjectExpression');
  }

  getParser() {
    return new ObjectExpressionParser();
  }
}
