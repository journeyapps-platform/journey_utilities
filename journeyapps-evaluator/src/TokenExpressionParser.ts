import * as babelParser from '@babel/parser';
import { Node } from '@babel/types';
import { memoize } from 'lodash';
import LRUCache from 'lru-cache';
import {
  AbstractExpressionParser,
  BlockStatementParserFactory,
  CallExpressionParserFactory,
  ConditionalExpressionParserFactory,
  ExpressionNodeParserFactory,
  ExpressionParserFactory,
  IdentifierExpressionParserFactory,
  LiteralExpressionParserFactory,
  MemberExpressionParserFactory,
  NodeType,
  ObjectExpressionParserFactory
} from './parsers';
import { TokenExpression } from './token-expressions';
import { BlockStatementTransformer, FormatSpecifierTransformer, SourceTransformer } from './transformers';

export interface TokenExpressionParseEvent {
  source: string;
  transformers?: (typeof SourceTransformer)[];
}

export class TokenExpressionParser {
  cache: LRUCache<string, TokenExpression>;
  factories: ExpressionParserFactory[];
  transformers: Record<string, SourceTransformer>;

  static instance: TokenExpressionParser;
  static get(): TokenExpressionParser {
    if (!this.instance) {
      this.instance = new TokenExpressionParser();
    }
    return this.instance;
  }

  constructor() {
    this.cache = new LRUCache({ max: 1000 });

    // Parser factories
    this.factories = [];
    this.registerFactory(new BlockStatementParserFactory());
    this.registerFactory(new CallExpressionParserFactory());
    this.registerFactory(new ConditionalExpressionParserFactory());
    this.registerFactory(new IdentifierExpressionParserFactory());
    this.registerFactory(new ExpressionNodeParserFactory());
    this.registerFactory(new LiteralExpressionParserFactory());
    this.registerFactory(new MemberExpressionParserFactory());
    this.registerFactory(new ObjectExpressionParserFactory());

    // Transformers
    this.transformers = {};
    this.registerTransformer(new BlockStatementTransformer());
    this.registerTransformer(new FormatSpecifierTransformer());
  }

  // TODO: Better lifecycle control and dispose it afterwards
  parse<T extends TokenExpression = TokenExpression>(event: TokenExpressionParseEvent): T | null {
    const source = this.transformSource(event);
    if (this.cache.has(source)) {
      return this.cache.get(source) as T;
    }

    const { program } = babelParser.parse(source);
    const node = program.body[0] ?? program.directives[0];
    const parsed = this.parseNode(node, source);
    this.cache.set(source, parsed);

    return parsed as T;
  }

  parseNode(node: Node, source: string): TokenExpression | null {
    const parser = this.getParser(node.type);
    return parser.parse({ node: node, source, parseNode: this.parseNode.bind(this) });
  }

  registerFactory(factory: ExpressionParserFactory) {
    this.factories.push(factory);
  }

  registerTransformer(transformer: SourceTransformer) {
    this.transformers[transformer.type] = transformer;
  }

  getParser = memoize((nodeType: NodeType): AbstractExpressionParser => {
    for (const factory of this.factories) {
      if (factory.canParse(nodeType)) {
        return factory.getParser();
      }
    }
    throw new Error(`No parser found for node type '${nodeType}'`);
  });

  transformSource(event: TokenExpressionParseEvent): string {
    const transformers = event.transformers ?? [];
    let transformed = event.source;
    for (const transformerType of transformers) {
      const transformer = this.transformers[transformerType.TYPE];
      if (!transformer) {
        throw new Error(`No transformer found for type '${transformerType}'`);
      }
      transformed = transformer.transform({ source: transformed });
    }

    return transformed;
  }
}
