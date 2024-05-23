import * as babelParser from '@babel/parser';
import { Node } from '@babel/types';
import { memoize } from 'lodash';
import { LRUCache } from 'lru-cache';
import {
  ExpressionParserFactory,
  BlockStatementParserFactory,
  CallExpressionParserFactory,
  ConditionalExpressionParserFactory,
  ExpressionNodeParserFactory,
  IdentifierExpressionParserFactory,
  LiteralExpressionParserFactory,
  MemberExpressionParserFactory,
  NodeType,
  ObjectExpressionParserFactory,
  AbstractExpressionParser
} from './parsers';
import { TokenExpression } from './token-expressions';

/**
 * Matches format specifiers in expressions in the form of `value:n`, `value:0n` or `value:.Xf`
 */
const FORMAT_SPECIFIER_IDENTIFIER = '$format';
const MATCH_FORMAT_SPECIFIER = /(?<!['"])[^{}]*[^\$](:(\.?\d+f?)[^{}]*)(?!['"])/;
const ENCLOSED_IN_CURLY_BRACKETS = /^{.*}$/;

export class TokenExpressionParser {
  factories: ExpressionParserFactory[];
  cache: LRUCache<string, TokenExpression>;

  static instance: TokenExpressionParser;
  static get(): TokenExpressionParser {
    if (!this.instance) {
      this.instance = new TokenExpressionParser();
    }
    return this.instance;
  }

  constructor() {
    this.factories = [];
    this.cache = new LRUCache({ max: 1000 });
    this.registerFactory(new BlockStatementParserFactory());
    this.registerFactory(new CallExpressionParserFactory());
    this.registerFactory(new ConditionalExpressionParserFactory());
    this.registerFactory(new IdentifierExpressionParserFactory());
    this.registerFactory(new ExpressionNodeParserFactory());
    this.registerFactory(new LiteralExpressionParserFactory());
    this.registerFactory(new MemberExpressionParserFactory());
    this.registerFactory(new ObjectExpressionParserFactory());
  }

  // TODO: Better lifecycle control and dispose it afterwards
  parse<T extends TokenExpression = TokenExpression>(source: string): T | null {
    const preprocessed = this.preprocess(source);

    if (this.cache.has(source)) {
      return this.cache.get(source) as T;
    }

    const { program } = babelParser.parse(preprocessed);
    const node = program.body[0] ?? program.directives[0];
    const parsed = this.parseNode(node, preprocessed);
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

  getParser = memoize((nodeType: NodeType): AbstractExpressionParser => {
    for (const factory of this.factories) {
      if (factory.canParse(nodeType)) {
        return factory.getParser();
      }
    }
    throw new Error(`No parser found for node type ${nodeType}`);
  });

  // TODO Implement preprocessor system, most likely as part of the ExpressionParserFactory
  private preprocess(input: string): string {
    const match = input.match(MATCH_FORMAT_SPECIFIER);
    if (match) {
      /** Preprocess format specifiers
       * value:0n -> {value; $format = "0n"}
       */
      const replaced = input.replace(match[1], `; ${FORMAT_SPECIFIER_IDENTIFIER} = "${match[2]}"`);
      return ENCLOSED_IN_CURLY_BRACKETS.test(replaced) ? replaced : `{${replaced}}`;
    }
    return input;
  }
}
