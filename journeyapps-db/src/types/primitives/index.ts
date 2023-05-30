import { PrimitiveType } from '@journeyapps/parser-schema';
import { Attachment } from '../Attachment';
import { Location } from '../Location';

import { AttachmentType } from './attachments/Attachment';
import { BooleanType } from './Boolean';
import { DateType } from './Date';
import { DatetimeType } from './Datetime';
import { GeoTrackType } from './GeoTrack';
import { IntegerType } from './Integer';
import { LocationType } from './Location';
import { MultipleChoiceType } from './MultipleChoice';
import { NumberType } from './Number';
import { SingleChoiceIntegerType } from './SingleChoiceInteger';
import { MultipleChoiceIntegerType } from './MultipleChoiceInteger';
import { SingleChoiceType } from './SingleChoice';
import { TextType } from './Text';
import { SignatureType } from './attachments/Signature';
import { PhotoType } from './attachments/Photo';

export const DBPrimitiveTypeMap = {
  [PrimitiveType.ATTACHMENT]: AttachmentType,
  [PrimitiveType.BOOLEAN]: BooleanType,
  [PrimitiveType.DATE]: DateType,
  [PrimitiveType.DATETIME]: DatetimeType,
  [PrimitiveType.GEO_TRACK]: GeoTrackType,
  [PrimitiveType.INTEGER]: IntegerType,
  [PrimitiveType.LOCATION]: LocationType,
  [PrimitiveType.MULTIPLE_CHOICE_INTEGER]: MultipleChoiceIntegerType,
  [PrimitiveType.MULTIPLE_CHOICE]: MultipleChoiceType,
  [PrimitiveType.NUMBER]: NumberType,
  [PrimitiveType.SINGLE_CHOICE_INTEGER]: SingleChoiceIntegerType,
  [PrimitiveType.SINGLE_CHOICE]: SingleChoiceType,
  [PrimitiveType.TEXT]: TextType,
  [PrimitiveType.SIGNATURE]: SignatureType,
  [PrimitiveType.PHOTO]: PhotoType
} as const;

export type DBPrimitiveTypeMap = typeof DBPrimitiveTypeMap;

export * from './attachments/Attachment';
export * from './attachments/Photo';
export * from './attachments/Signature';
export * from './Boolean';
export * from './Date';
export * from './Datetime';
export * from './GeoTrack';
export * from './Integer';
export * from './Location';
export * from './Number';
export * from './Text';

export * from './MultipleChoice';
export * from './MultipleChoiceInteger';
export * from './SingleChoice';
export * from './SingleChoiceInteger';

export { Attachment, Location };
