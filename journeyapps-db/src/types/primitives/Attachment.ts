import { AttachmentType } from '@journeyapps/parser-schema';
import { Attachment, toBackendData } from '../../Attachment';
import { isValid } from '../../utils/uuid';
import { DBTypeMixin, ValueSerializeOptions } from '../Type';

type GConstructor<T extends AttachmentType = AttachmentType> = new (...args: any[]) => T;

export function DBAttachmentTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    valueToJSON(value: Attachment, options?: ValueSerializeOptions) {
      if (!value) {
        return null;
      } else if (options?.inlineAttachments) {
        return value[toBackendData]();
      } else {
        return value.id;
      }
    }

    valueFromJSON(value: any) {
      if (value != null) {
        return new Attachment(value);
      }
    }

    cast(value: any) {
      if (Attachment.isAttachment(value)) {
        return value;
      } else if (typeof value == 'string') {
        if (!isValid(value)) {
          throw new Error(value + ' is not a valid id');
        } else {
          return new Attachment(value);
        }
      } else if (typeof value == 'object') {
        return new Attachment(value);
      } else {
        throw new Error(value + ' is not a valid id');
      }
    }
  };
}

export class DBAttachmentType extends DBAttachmentTypeMixin(AttachmentType) {}
