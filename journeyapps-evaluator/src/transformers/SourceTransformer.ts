export interface TransformSourceEvent {
  source: string;
}

export abstract class SourceTransformer {
  static TYPE: string;
  readonly type: string;

  constructor(type: string) {
    this.type = type;
  }

  abstract transform(event: TransformSourceEvent): string;
}
