import { DBTypeMixin } from './Type';
import { ArrayType as SchemaArrayType } from '@journeyapps/parser-schema';

export class ArrayType extends DBTypeMixin(SchemaArrayType) {}
