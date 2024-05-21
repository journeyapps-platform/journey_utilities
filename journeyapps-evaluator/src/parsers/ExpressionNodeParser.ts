import {
  Directive,
  ExpressionStatement,
  isDirective,
  isExpressionStatement,
  isLabeledStatement,
  LabeledStatement,
  Node
} from '@babel/types';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export type ExpressionType = ExpressionStatement | Directive | LabeledStatement;

export class ExpressionNodeParser extends AbstractExpressionParser<ExpressionType> {
  parse(event: ExpressionNodeEvent) {
    const { node } = this;
    let expression: Node;
    if (isLabeledStatement(node)) {
      expression = node.body;
    } else if (isDirective(node)) {
      expression = node.value;
    } else if (isExpressionStatement(node)) {
      expression = node.expression;
    }
    expression.extra = { ...expression.extra, parent: node };
    return event.parseNode(expression, event.source);
  }
}

export class ExpressionNodeParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isLabeledStatement(node) || isDirective(node) || isExpressionStatement(node)) {
      return new ExpressionNodeParser({ node });
    }
    return null;
  }
}
