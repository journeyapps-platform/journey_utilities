import { PhotoType } from './attachments/Photo';
import { BooleanType } from './Boolean';
import { DateType } from './Date';
import { DatetimeType } from './Datetime';
import { IntegerType } from './Integer';
import { MultipleChoiceType } from './MultipleChoice';
import { MultipleChoiceIntegerType } from './MultipleChoiceInteger';
import { NumberType } from './Number';
import { SingleChoiceType } from './SingleChoice';
import { SingleChoiceIntegerType } from './SingleChoiceInteger';
import { TextType } from './Text';
import { LocationType } from './Location';
import { GeoTrackType } from './GeoTrack';
import { AttachmentType } from './attachments/Attachment';
import { SignatureType } from './attachments/Signature';

// Collection of primitive types.
// Each type is a constructor creating a default instance of that type.
export const primitives = {
  [AttachmentType.TYPE]: AttachmentType,
  [BooleanType.TYPE]: BooleanType,
  [TextType.TYPE]: TextType,
  [LocationType.TYPE]: LocationType,
  [GeoTrackType.TYPE]: GeoTrackType,
  [SingleChoiceType.TYPE]: SingleChoiceType,
  [SingleChoiceIntegerType.TYPE]: SingleChoiceIntegerType,
  [MultipleChoiceType.TYPE]: MultipleChoiceType,
  [MultipleChoiceIntegerType.TYPE]: MultipleChoiceIntegerType,
  [IntegerType.TYPE]: IntegerType,
  [NumberType.TYPE]: NumberType,
  [DateType.TYPE]: DateType,
  [DatetimeType.TYPE]: DatetimeType,
  [PhotoType.TYPE]: PhotoType,
  [SignatureType.TYPE]: SignatureType
};

// Collection of primitive type names
export type PrimitiveTypeName = keyof typeof primitives;

// Return a new instance of the primitive type with the given name and return type from the mapping above
export function primitive<T extends PrimitiveTypeName>(name: T): InstanceType<typeof primitives[T]> | null {
  const Constructor = primitives[name];
  if (Constructor) {
    return new Constructor() as InstanceType<typeof primitives[T]>;
  } else {
    return null;
  }
}

export * from './PrimitiveType';

export * from './Boolean';
export * from './Date';
export * from './Datetime';
export * from './Integer';
export * from './Number';
export * from './Text';
export * from './Location';
export * from './GeoTrack';

export * from './ChoiceType';
export * from './MultipleChoice';
export * from './MultipleChoiceInteger';
export * from './SingleChoice';
export * from './SingleChoiceInteger';

export * from './attachments/Attachment';
export * from './attachments/Photo';
export * from './attachments/Signature';
