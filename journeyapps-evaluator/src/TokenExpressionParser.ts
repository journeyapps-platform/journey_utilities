import * as babelParser from '@babel/parser';
import { Node } from '@babel/types';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  BlockStatementParserFactory,
  CallExpressionParserFactory,
  ConditionalExpressionParserFactory,
  ExpressionNodeParserFactory,
  IdentifierExpressionParserFactory,
  LiteralExpressionParserFactory,
  MemberExpressionParserFactory,
  ObjectExpressionParserFactory
} from './parsers';
import { TokenExpression } from './token-expressions';

/**
 * Matches format specifiers in expressions in the form of `value:n`, `value:0n` or `value:.Xf`
 */
const MATCH_FORMAT_SPECIFIER = /(?<!['"])[^{}]*[^\$](:(\.?\d+f?)[^{}]*)(?!['"])/;
const ENCLOSED_IN_CURLY_BRACKETS = /^{.*}$/;

export class TokenExpressionParser {
  factories: AbstractExpressionParserFactory[];
  static FORMAT_SPECIFIER_IDENTIFIER = '$format';

  constructor() {
    this.factories = [];
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
    const { program } = babelParser.parse(preprocessed);
    const node = program.body[0] ?? program.directives[0];
    return this.parseNode(node, preprocessed) as T;
  }

  parseNode(node: Node, source: string): TokenExpression | null {
    const parser = this.getParser(node);
    if (!parser) {
      throw new Error(`No Parser found for node: ${node.type}`);
    }

    return parser.parse({ source, parseNode: this.parseNode.bind(this) });
  }

  registerFactory(factory: AbstractExpressionParserFactory) {
    this.factories.push(factory);
  }

  getParser(node: Node): AbstractExpressionParser | null {
    for (const factory of this.factories) {
      const parser = factory.getParser(node);
      if (parser) {
        return parser;
      }
    }
    return null;
  }

  private preprocess(input: string): string {
    const match = input.match(MATCH_FORMAT_SPECIFIER);
    if (match) {
      /** Preprocess format specifiers
       * value:0n -> {value; $format = "0n"}
       */
      const replaced = input.replace(
        match[1],
        `; ${TokenExpressionParser.FORMAT_SPECIFIER_IDENTIFIER} = "${match[2]}"`
      );
      return ENCLOSED_IN_CURLY_BRACKETS.test(replaced) ? replaced : `{${replaced}}`;
    }
    return input;
  }
}
