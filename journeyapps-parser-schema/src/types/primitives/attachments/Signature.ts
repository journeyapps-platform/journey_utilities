import { AttachmentType } from './Attachment';

export class SignatureType extends AttachmentType {
  static TYPE = 'signature';

  constructor() {
    super();
    this.media = 'image/svg+xml';
  }

  stringify(): string {
    return SignatureType.TYPE;
  }
}
