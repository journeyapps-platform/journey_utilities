import { SignatureType } from '@journeyapps/parser-schema';
import { DBAttachmentType, DBAttachmentTypeMixin } from './Attachment';

export class DBSignatureType extends DBAttachmentTypeMixin(SignatureType) {}
