import { TypeInterface } from '@journeyapps/evaluator';
import { PrimitiveType } from '../PrimitiveType';

export class AttachmentType extends PrimitiveType {
  static readonly TYPE = 'attachment';

  static isInstanceOf(type: TypeInterface): type is AttachmentType {
    return type.name === AttachmentType.TYPE;
  }

  media?: string;
  autoDownload?: boolean;

  constructor() {
    super(AttachmentType.TYPE);
  }
}
