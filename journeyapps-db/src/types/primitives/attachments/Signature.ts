import { SignatureType as SchemaSignatureType } from '@journeyapps/parser-schema';
import { DBAttachmentTypeMixin } from './Attachment';

export class SignatureType extends DBAttachmentTypeMixin(SchemaSignatureType) {}
