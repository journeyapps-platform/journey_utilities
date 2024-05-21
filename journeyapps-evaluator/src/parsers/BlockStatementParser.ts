import {
  Node,
  BlockStatement,
  isLabeledStatement,
  isExpressionStatement,
  isBlockStatement,
  Statement,
  isAssignmentExpression,
  isStringLiteral
} from '@babel/types';
import { ConstantTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export class BlockStatementParser extends AbstractExpressionParser<BlockStatement> {
  parse(event: ExpressionNodeEvent) {
    const { node } = this;
    const { source, parseNode } = event;
    // If parent is also a BlockStatement means we have an escaped FormatString, e.g. {{value}}
    // and it will be handled by `ExpressionStatement` lower down
    if (isBlockStatement(node.extra?.parent as Node)) {
      return null;
    }
    const [body, formatStm] = node.body;
    if (isBlockStatement(body)) {
      return new ConstantTokenExpression(source.slice(body.start, body.end));
    }
    if (isLabeledStatement(body)) {
      // Example `{$:foo()}`
      const { body: child } = body;
      child.extra = { ...child.extra, parent: node };
      return parseNode(child, source);
    }
    if (isExpressionStatement(body)) {
      const { expression: child } = body;
      child.extra = { ...child.extra, parent: node, format: this.getFormatSpecifier(formatStm) };
      return parseNode(child, source);
    }
  }

  getFormatSpecifier(stm: Statement | null): string {
    if (!isExpressionStatement(stm)) {
      return;
    }
    const { expression } = stm;
    if (!isAssignmentExpression(expression)) {
      return;
    }
    return isStringLiteral(expression.right) ? expression.right.value : null;
  }
}

export class BlockStatementParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isBlockStatement(node)) {
      return new BlockStatementParser({ node });
    }
    return null;
  }
}
