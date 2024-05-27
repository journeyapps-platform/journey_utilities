export abstract class SourceTransformer {
  constructor(readonly type: string) {}

  abstract transform(source: string): string;
}
