export default function findOne(db, name, { pKey, sKey }) {
  const params = {
    TableName: name,
    Key: {},
  };

  // For schema with just a primary key, use a simple function
  if (!sKey) {
    return id => new Promise((resolve, reject) => {
      params.Key[pKey] = id;
      db.get(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data.Item || null);
      });
    });
  }

  // For schema with both partition key and sort key, return a function
  // that requires both
  return (primary, secondary) => new Promise((resolve, reject) => {
    params.Key[pKey] = primary;
    params.Key[sKey] = secondary;
    db.get(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data.Item || null);
    });
  });
}
