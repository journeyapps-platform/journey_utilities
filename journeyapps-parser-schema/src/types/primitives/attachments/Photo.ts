import { AttachmentType } from './Attachment';

export class PhotoType extends AttachmentType {
  static readonly SUB_TYPE = 'photo';

  constructor() {
    super();
    this.media = 'image/jpeg';
  }

  stringify(): string {
    return PhotoType.SUB_TYPE;
  }
}
