import { AttachmentType } from './attachments/Attachment';
import { TextType } from './Text';
import { BooleanType } from './Boolean';
import { LocationType } from './Location';
import { GeoTrackType } from './GeoTrack';
import { SingleChoiceType } from './SingleChoice';
import { SingleChoiceIntegerType } from './SingleChoiceInteger';
import { MultipleChoiceType } from './MultipleChoice';
import { MultipleChoiceIntegerType } from './MultipleChoiceInteger';
import { IntegerType } from './Integer';
import { NumberType } from './Number';
import { DateType } from './Date';
import { DatetimeType } from './Datetime';
import { PhotoType } from './attachments/Photo';
import { SignatureType } from './attachments/Signature';

// Collection of primitive types.
// Each type is a constructor creating a default instance of that type.
export const PrimitiveTypeMap = {
  [AttachmentType.TYPE]: AttachmentType,
  [PhotoType.SUB_TYPE]: PhotoType,
  [SignatureType.SUB_TYPE]: SignatureType,
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
} as const;

// Collection of primitive type names
export type PrimitiveTypeName = keyof typeof PrimitiveTypeMap;

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
