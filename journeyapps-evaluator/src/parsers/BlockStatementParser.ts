import { Node, BlockStatement, isLabeledStatement, isExpressionStatement, isBlockStatement } from '@babel/types';
import { FormatStringContext } from '../context/FormatStringContext';
import { FunctionExpressionContext } from '../context/FunctionExpressionContext';
import { ConstantTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export class BlockStatementParser extends AbstractExpressionParser<BlockStatement> {
  parse(event: ExpressionNodeParseEvent<BlockStatement>) {
    const { node, source, context, parseNode } = event;
    // If parent is also a BlockStatement means we have an escaped FormatString, e.g. {{value}}
    // and it will be handled by `ExpressionStatement` lower down
    if (isBlockStatement(node.extra?.parent as Node)) {
      return null;
    }
    const [body, formatStm] = node.body;
    if (isBlockStatement(body)) {
      return new ConstantTokenExpression({ expression: source.slice(body.start, body.end) });
    }
    // Example `{$:foo()}`
    if (isLabeledStatement(body)) {
      const { body: child } = body;
      child.extra = { ...child.extra, parent: node };
      return parseNode({ ...event, node: child, context: new FunctionExpressionContext() });
    }
    // Example `{item.price}`
    if (isExpressionStatement(body)) {
      const { expression: child } = body;
      child.extra = { ...child.extra, parent: node };

      // Example `{item.price; $format = ".2f"}
      if (FormatStringContext.isInstanceOf(context)) {
        child.extra.format = context.getFormatSpecifier(formatStm);
      }

      return parseNode({ ...event, node: child });
    }
  }
}

export class BlockStatementParserFactory extends ExpressionParserFactory<BlockStatementParser> {
  constructor() {
    super('BlockStatement');
  }
  getParser() {
    return new BlockStatementParser();
  }
}
