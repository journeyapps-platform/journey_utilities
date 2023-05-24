import { ObjectType } from '@journeyapps/parser-schema';

ObjectType.prototype.cast = function (value) {
    if (typeof value != 'object') {
        throw new Error(value + ' is not an object');
    }
    if (
        value.type != null &&
        value.type instanceof ObjectType &&
        value.type.name == this.name &&
        typeof value._save == 'function'
    ) {
        // This implies that value is (likely) also an instance of DatabaseObject.
        return value;
    } else {
        throw new Error('Expected ' + value + ' to have type ' + this.name);
    }
};

ObjectType.prototype.format = function (value, format) {
    return value.toString();
};

ObjectType.prototype.clone = function (value) {
    return value._clone();
};