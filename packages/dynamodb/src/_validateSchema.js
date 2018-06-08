import { HASH, RANGE } from './_Field';

function noAuto(key, name) {
  if (key && key.isAuto) {
    throw new Error(`${name} schema has declared an auto id on ${key.name} where it doesn't make any sense`);
  }
}

export default function validateSchema(schema, name) {
  if (!Array.isArray(schema)) {
    throw new Error(`${name} schema should be described using array`);
  }

  if (schema.length === 0) {
    throw new Error(`${name} schema should have at least one partition key`);
  }

  const all = {};
  let pKey = null;
  let sKey = null;
  const globalIndexes = {};
  const localIndexes = {};

  schema.forEach((f) => {
    if (all[f.name]) {
      throw new Error(`${name} schema has multiple definitions for ${f.name}`);
    }

    // Handle the keys first
    if (f.keyType === HASH) {
      if (pKey) {
        throw new Error(`${name} schema has multiple partition keys ${f.name} and ${pKey}`);
      }

      pKey = f;
    } else if (f.keyType === RANGE) {
      if (sKey) {
        throw new Error(`${name} schema has multiple sort keys ${f.name} and ${sKey.name}`);
      }

      sKey = f;
    }

    // Check if there is a local secondary index
    if (f.localIndex) {
      // A local secondary index doesn't make sense on a a partition key
      if (f.keyType === HASH) {
        throw new Error(`${name} schema has a local secondary index ${f.localIndex} on a partition key ${f.name}`);
      }

      // Don't repeat the index name
      if (localIndexes[f.localIndex]) {
        throw new Error(`${name} schema already has local secondary index named ${f.localIndex}`);
      }

      localIndexes[f.localIndex] = f;
    }

    // Check for global secondary indexes
    if (f.globalIndex) {
      const globalIndex = globalIndexes[f.globalIndex.name];
      if (!globalIndex) {
        globalIndexes[f.globalIndex.name] = {
          [f.globalIndex.type === HASH ? 'pKey' : 'sKey']: f,
        };
      } else if (f.globalIndex.type === HASH) {
        if (globalIndex.pKey) {
          throw new Error(`${name} schema can't declare multiple partition keys for global secondary index ${f.globalIndex.name}`);
        }
        globalIndex.pKey = f;
      } else {
        if (globalIndex.sKey) {
          throw new Error(`${name} schema can't declare multiple sort keys for global secondary index ${f.globalIndex.name}`);
        }
        globalIndex.sKey = f;
      }
    }

    all[f.name] = f;
  });


  // There must always be a primary key
  if (!pKey) {
    throw new Error(`${name} schema doesn't declare a partition key`);
  }

  // Auto ID doesn't make sense on sort keys, or partition key with sort key
  if (pKey.isAuto && sKey) {
    throw new Error(`${name} schema automatic generated partition key values for ${pKey.name} doesn't make sense along side a sort key ${sKey.name}`);
  }

  // Auto ID doesn't make sense on sort keys
  noAuto(sKey, name);

  // Also check for non existent primary keys and non-sensical auto id
  Object.keys(globalIndexes).forEach((k) => {
    if (!globalIndexes[k].pKey) {
      throw new Error(`${name} schema doesn't declare a partition key for global secondary index ${k}`);
    }

    // Also make sure the auto generation is not set for global indexes
    noAuto(globalIndexes[k].sKey, name);
  });

  // Auto Id doesn't make sense on local secondary keys as well
  Object.keys(localIndexes).forEach((k) => {
    noAuto(localIndexes[k], name);
  });

  const keys = sKey ? [pKey, sKey] : [pKey];

  // also include a keys property in global indexes along with read and write units
  Object.keys(globalIndexes).forEach((n) => {
    const g = globalIndexes[n];
    g.keys = g.sKey ? [g.pKey, g.sKey] : [g.pKey];
    g.readCapacityUnits = g.pKey.globalIndex.readCapacityUnits;
    g.writeCapacityUnits = g.pKey.globalIndex.writeCapacityUnits;
  });

  return {
    keys,
    pKey,
    sKey,
    globalIndexes: Object.keys(globalIndexes).length > 0 ? globalIndexes : null,
    localIndexes: Object.keys(localIndexes).length > 0 ? localIndexes : null,
    all,
  };
}
