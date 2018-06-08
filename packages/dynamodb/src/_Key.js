import Field from './_Field';

// Dynamodb key type for partition key
export const HASH = 'HASH';

// Dynamodb key type for sort key
export const RANGE = 'RANGE';

class Key extends Field {
  constructor(name) {
    super(name);
    this.isAuto = false; // Does the key needs to be automatically generated
    this.keyType = HASH;  // The type of the key either hash (partition) or range (sort)
    this.globalIndexName = null; // Is this key part of a global secondary index
    this.localIndexName = null; // Is this key part of a local secondary index
  }

  sort() {
    if (this.isAuto) {
      throw new Error(`Key ${this.name} can't have auto and sort field set`);
    }

    this.keyType = RANGE;
    return this;
  }

  auto() {
    if (this.keyType !== HASH) {
      throw new Error(`Key ${this.name} can't have auto and sort field set`);
    }
    this.isAuto = true;
    return this;
  }

  globalIndex(name) {
    this.globalIndexName = name;
  }

  localIndex(name) {
    if (this.keyType === HASH) {
      throw new Error(`Key ${this.name} is a hash key can't be used for local secondary index`);
    }
    this.localIndexName = name;
  }
}

export default Key;
