export const TYPE_STRING = 'S';
export const TYPE_NUMBER = 'N';
export const TYPE_BOOLEAN = 'BOOL';
export const TYPE_LIST = 'L';
export const TYPE_MAP = 'M';
export const TYPE_BINARY = 'B';
export const TYPE_STRING_SET = 'SS';
export const TYPE_NUMBER_SET = 'NS';
export const TYPE_BINARY_SET = 'BS';
export const TYPE_NULL = 'NULL';


// Dynamodb key type for partition key
export const HASH = 'HASH';

// Dynamodb key type for sort key
export const RANGE = 'RANGE';


class Field {
  constructor(name) {
    this.name = name; // The name of the field
    this.isRequired = false;  // Flag to ensure if the attribute is required
    this.attributeType = TYPE_STRING; // The type of the attribute, string by default

    this.globalIndex = null; // An object to define global secondary index name and type
    this.localIndex = null; // Local secondary index name on this field

    this.hasttl = false; // Time to live marker attrbute
  }

  number() {
    this.attributeType = TYPE_NUMBER;
    return this;
  }

  boolean() {
    this.attributeType = TYPE_BOOLEAN;
    return this;
  }

  list() {
    this.attributeType = TYPE_LIST;
    return this;
  }

  map() {
    this.attributeType = TYPE_MAP;
    return this;
  }

  binary() {
    this.attributeType = TYPE_BINARY;
    return this;
  }

  set() {
    if (this.attributeType === TYPE_STRING) {
      this.attributeType = TYPE_STRING_SET;
    } else if (this.attributeType === TYPE_NUMBER) {
      this.attributeType = TYPE_NUMBER_SET;
    } else if (this.attributeType === TYPE_BINARY) {
      this.attributeType = TYPE_BINARY_SET;
    } else {
      throw new Error(`Invalid scalar type to declare set for ${this.name}`);
    }
  }

  required() {
    this.isRequired = true;
    return this;
  }

  global(name, sort = false, readCapacityUnits = 5, writeCapacityUnits = 1) {
    this.globalIndex = {
      name,
      type: sort ? RANGE : HASH,
      readCapacityUnits,
      writeCapacityUnits,
    };
    return this;
  }

  local(name) {
    this.localIndex = name;
    return this;
  }

  ttl() {
    this.hasttl = true;
    this.attributeType = TYPE_NUMBER;
    return this;
  }
}

export default Field;
