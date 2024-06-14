import { SourceTransformer } from './SourceTransformer';

const ENCLOSED_IN_CURLY_BRACKETS = /^{.*}$/;

/**
 * Wraps source code in a block statement if it is not already
 */
export class BlockStatementTransformer extends SourceTransformer {
  static TYPE = 'block-statement-transformer';
  constructor() {
    super(BlockStatementTransformer.TYPE);
  }

  transform(source: string): string {
    return !ENCLOSED_IN_CURLY_BRACKETS.test(source) ? `{${source}}` : source;
  }
}
