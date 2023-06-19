import { AttachmentType } from './Attachment';

export class SignatureType extends AttachmentType {
  static readonly SUB_TYPE = 'signature';

  constructor() {
    super();
    this.media = 'image/svg+xml';
  }

  stringify(): string {
    return SignatureType.SUB_TYPE;
  }
}
