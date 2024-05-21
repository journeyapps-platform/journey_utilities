import { Node } from '@babel/types';
import { TokenExpression } from '../token-expressions';

export interface ExpressionNodeEvent {
  source: string;
  parseNode(node: Node, source: string): TokenExpression | null;
}

export interface AbstractExpressionParserOptions<N extends Node = Node> {
  node: N;
}

export abstract class AbstractExpressionParser<
  N extends Node = Node,
  T extends TokenExpression = TokenExpression,
  O extends AbstractExpressionParserOptions<N> = AbstractExpressionParserOptions<N>
> {
  options: O;

  constructor(options: O) {
    this.options = options;
  }

  abstract parse(event: ExpressionNodeEvent): T;

  get node() {
    return this.options.node;
  }
}

export abstract class AbstractExpressionParserFactory {
  abstract getParser(node: Node): AbstractExpressionParser | null;
}
