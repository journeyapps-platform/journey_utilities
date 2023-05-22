import { AttachmentType } from './Attachment';

export class PhotoType extends AttachmentType {
  static TYPE = 'photo';

  constructor() {
    super();
    this.media = 'image/jpeg';
  }

  stringify(): string {
    return PhotoType.TYPE;
  }
}
