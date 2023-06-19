import { PhotoType as SchemaPhotoType } from '@journeyapps/parser-schema';
import { DBAttachmentTypeMixin } from './Attachment';

export class PhotoType extends DBAttachmentTypeMixin(SchemaPhotoType) {}
