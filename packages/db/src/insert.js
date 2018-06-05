export default function insert(db, name, { pKey, sKey }) {
  const params = {
    TableName: name,
    ConditionExpression: 'attribute_not_exists(#p)',
    ExpressionAttributeNames: {
      '#p': pKey,
    },
  };

  if (sKey) {
    params.ConditionExpression = `${params.ConditionExpression} AND attribute_not_exists(#s)`;
    params.ExpressionAttributeNames['#s'] = sKey;
  }

  return record => new Promise((resolve, reject) => {
    params.Item = record;
    db.put(params, (err) => {
      if (err) {
        return reject(err);
      }

      if (sKey) {
        return resolve({
          [pKey]: record[pKey],
          [sKey]: record[sKey],
        });
      }

      return resolve(record[pKey]);
    });
  });
}
