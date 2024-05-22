import { Node, Aliases, isType } from '@babel/types';
import { TokenExpression } from '../token-expressions';

export type NodeType = Node['type'] | keyof Aliases;

export interface ExpressionNodeEvent<N extends Node = Node> {
  source: string;
  node: N;
  parseNode(node: Node, source: string): TokenExpression | null;
}

export interface AbstractExpressionParserOptions {}

export abstract class AbstractExpressionParser<
  N extends Node = Node,
  T extends TokenExpression = TokenExpression,
  O extends AbstractExpressionParserOptions = AbstractExpressionParserOptions,
  E extends ExpressionNodeEvent<N> = ExpressionNodeEvent<N>
> {
  options: O;

  constructor(options?: O) {
    this.options = { ...options };
  }

  abstract parse(event: E): T;
}

export abstract class ExpressionParserFactory<P extends AbstractExpressionParser = AbstractExpressionParser> {
  types: NodeType[];
  constructor(types: NodeType | NodeType[]) {
    this.types = Array.isArray(types) ? types : [types];
  }

  abstract getParser(): P;

  canParse(type: NodeType): boolean {
    return this.types.some((t) => isType(type, t));
  }
}
