export default function createTable(db, name, { pKey, sKey, schema }) {
  // The entire code for the createTable has been moved within the
  // returned function to avoid any sustained memory use, since, createTable
  // are not used frequently, and they need not be as efficient as
  // other database operations
  return (readUnits = 1, writeUnits = 1) => new Promise((resolve, reject) => {
    const params = {
      TableName: name,
      KeySchema: [
        {
          AttributeName: pKey,
          KeyType: schema[pKey].keyType,
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: pKey,
          AttributeType: schema[pKey].attributeType,
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: readUnits,
        WriteCapacityUnits: writeUnits,
      },
    };

    if (sKey) {
      params.KeySchema.push({
        AttributeName: sKey,
        KeyType: schema[sKey].keyType,
      });
      params.AttributeDefinitions.push({
        AttributeName: sKey,
        AttributeType: schema[sKey].attributeType,
      });
    }

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
