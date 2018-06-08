import { HASH, RANGE } from './_Field';

export default function createTable(
  db,
  name,
  {
    pKey, keys, globalIndexes, localIndexes, all,
  }
) {
  // The entire code for the createTable has been moved within the
  // returned function to avoid any sustained memory use, since, createTable
  // are not used frequently, and they need not be as efficient as
  // other database operations
  return (readUnits = 1, writeUnits = 1) => new Promise((resolve, reject) => {
    const params = {
      TableName: name,
      KeySchema: keys.map(k => ({
        AttributeName: k.name,
        KeyType: k.keyType,
      })),
      // AttributeDefinitions need to include only the key
      AttributeDefinitions: Object.keys(all).map(k => all[k]).filter(k => (
        k.keyType || k.globalIndex || k.localIndex
      )).map(k => ({
        AttributeName: k.name,
        AttributeType: k.attributeType,
      })),
      ProvisionedThroughput: {
        ReadCapacityUnits: readUnits,
        WriteCapacityUnits: writeUnits,
      },
    };

    if (globalIndexes) {
      params.GlobalSecondaryIndexes = Object.keys(globalIndexes).map(n => ({
        IndexName: n,
        KeySchema: globalIndexes[n].keys.map(k => ({
          AttributeName: k.name,
          KeyType: k === globalIndexes[n].pKey ? HASH : RANGE,
        })),
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: globalIndexes[n].readCapacityUnits,
          WriteCapacityUnits: globalIndexes[n].writeCapacityUnits,
        },
      }));
    }

    if (localIndexes) {
      params.LocalSecondaryIndexes = Object.keys(localIndexes).map(n => ({
        IndexName: n,
        KeySchema: [{
          AttributeName: pKey.name,
          KeyType: HASH,
        }, {
          AttributeName: localIndexes[n].name,
          KeyType: RANGE,
        }],
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
      }));
    }

    // console.log(JSON.stringify(params, null, 2));
    // console.log(params);
    db.createTable(params, (err) => {
      if (err) {
        if (err.code === 'ResourceInUseException') {
          return resolve(false);
        }
        return reject(err);
      }

      return resolve(true);
    });
  });
}
