import Field, { HASH, RANGE } from './_Field';

class Key extends Field {
  constructor(name) {
    super(name);
    this.isAuto = false; // Does the key needs to be automatically generated
    this.keyType = HASH;  // The type of the key either hash (partition) or range (sort)
  }

  sort() {
    if (this.isAuto) {
      // throw new Error(`Key ${this.name} can't have auto and sort field set`);
    }

    this.keyType = RANGE;
    return this;
  }

  auto() {
    if (this.keyType !== HASH) {
      // throw new Error(`Key ${this.name} can't have auto and sort field set`);
    }
    this.isAuto = true;
    return this;
  }
}

export default Key;
