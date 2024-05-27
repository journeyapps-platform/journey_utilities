import { SourceTransformer } from '../transformers';

export interface ParseContextOptions {
  transformers?: SourceTransformer[];
}

export abstract class ParseContext {
  options: ParseContextOptions;
  constructor(readonly type: string, options?: ParseContextOptions) {
    this.options = { transformers: [], ...options };
  }

  hasTransformers(): boolean {
    return this.options.transformers.length > 0;
  }

  /**
   * Transform the source code before parsing.
   */
  transformSource(source: string): string {
    return this.options.transformers.reduce((source, transformer) => transformer.transform(source), source);
  }
}

export abstract class ParseContextFactory<C extends ParseContext = ParseContext> {
  abstract inferParseContext(source: string): C | null;
}
