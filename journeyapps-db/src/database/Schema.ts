import { PrimitiveTypeMap, PrimitiveTypeName, Schema } from '@journeyapps/parser-schema';
import { DBObjectTypeFactory } from '../types/ObjectType';
import {
  DBAttachmentType,
  DBBooleanType,
  DBDatetimeType,
  DBDateType,
  DBIntegerType,
  DBLocationType,
  DBMultipleChoiceIntegerType,
  DBMultipleChoiceType,
  DBNumberType,
  DBSingleChoiceIntegerType,
  DBSingleChoiceType,
  DBTextType
} from '../types/primitives';
import { DBPhotoType } from '../types/primitives/attachments/Photo';
import { DBSignatureType } from '../types/primitives/attachments/Signature';
import { DBQueryTypeFactory } from '../types/QueryType';

export class DBSchema extends Schema {
  constructor() {
    super();

    this.registerTypeFactory(new DBObjectTypeFactory());
    this.registerTypeFactory(new DBQueryTypeFactory());

    // Register all primitives
    this.registerTypeFactory({
      type: DBAttachmentType.TYPE,
      generate: () => new DBAttachmentType()
    });
    this.registerTypeFactory({
      type: DBPhotoType.SUB_TYPE,
      generate: () => new DBPhotoType()
    });
    this.registerTypeFactory({
      type: DBSignatureType.SUB_TYPE,
      generate: () => new DBSignatureType()
    });
    this.registerTypeFactory({
      type: DBBooleanType.TYPE,
      generate: () => new DBBooleanType()
    });
    this.registerTypeFactory({
      type: DBDateType.TYPE,
      generate: () => new DBDateType()
    });
    this.registerTypeFactory({
      type: DBDatetimeType.TYPE,
      generate: () => new DBDatetimeType()
    });
    this.registerTypeFactory({
      type: DBIntegerType.TYPE,
      generate: () => new DBIntegerType()
    });
    this.registerTypeFactory({
      type: DBNumberType.TYPE,
      generate: () => new DBNumberType()
    });
    this.registerTypeFactory({
      type: DBTextType.TYPE,
      generate: () => new DBTextType()
    });
    this.registerTypeFactory({
      type: DBLocationType.TYPE,
      generate: () => new DBLocationType()
    });
    this.registerTypeFactory({
      type: DBMultipleChoiceType.TYPE,
      generate: () => new DBMultipleChoiceType()
    });
    this.registerTypeFactory({
      type: DBMultipleChoiceIntegerType.TYPE,
      generate: () => new DBMultipleChoiceIntegerType()
    });
    this.registerTypeFactory({
      type: DBSingleChoiceType.TYPE,
      generate: () => new DBSingleChoiceType()
    });
    this.registerTypeFactory({
      type: DBSingleChoiceIntegerType.TYPE,
      generate: () => new DBSingleChoiceIntegerType()
    });
  }

  // Return a new instance of the primitive type with the given name and return type from the mapping above
  primitive<T extends PrimitiveTypeName>(name: T | string): InstanceType<typeof PrimitiveTypeMap[T]> | null {
    return super.primitive(name);
  }
}
