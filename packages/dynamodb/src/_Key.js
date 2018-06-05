import Field from './_Field';

// Dynamodb key type for partition key
export const HASH = 'HASH';

// Dynamodb key type for sort key
export const RANGE = 'RANGE';

class Key extends Field {
  constructor() {
    super();
    this.auto = false;
    this.keyType = HASH;
  }

  sort() {
    this.keyType = RANGE;
    return this;
  }

  setAuto() {
    this.auto = true;
    return this;
  }
}

export default Key;
