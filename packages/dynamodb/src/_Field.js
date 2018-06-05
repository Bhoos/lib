export const STRING = 'S';
export const NUMERIC = 'N';

class Field {
  constructor() {
    this.required = false;
    this.attributeType = STRING;
  }

  number() {
    this.attributeType = NUMERIC;
    return this;
  }

  setType(typeCode) {
    this.attributeType = typeCode;
    return this;
  }

  setRequired() {
    this.required = true;
    return this;
  }
}

export default Field;
