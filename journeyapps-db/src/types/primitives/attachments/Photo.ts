import { PhotoType } from '@journeyapps/parser-schema';
import { DBAttachmentTypeMixin } from './Attachment';

export class DBPhotoType extends DBAttachmentTypeMixin(PhotoType) {}
