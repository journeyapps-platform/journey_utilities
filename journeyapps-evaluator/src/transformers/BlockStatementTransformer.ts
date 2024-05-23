import { SourceTransformer, TransformSourceEvent } from './SourceTransformer';

const ENCLOSED_IN_CURLY_BRACKETS = /^{.*}$/;

/**
 * Wraps source code in a block statement if it is not already
 */
export class BlockStatementTransformer extends SourceTransformer {
  static TYPE = 'to-block-statement';
  constructor() {
    super(BlockStatementTransformer.TYPE);
  }

  transform(event: TransformSourceEvent): string {
    const { source } = event;
    return !ENCLOSED_IN_CURLY_BRACKETS.test(source) ? `{${source}}` : source;
  }
}
