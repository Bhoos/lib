export default function remove(db, name, { pKey, sKey }) {
  const params = {
    TableName: name,
    Key: {},
    ConditionExpression: 'attribute_exists(#p)',
    ExpressionAttributeNames: {
      '#p': pKey,
    },
  };


  if (!sKey) {
    return id => new Promise((resolve, reject) => {
      params.Key[pKey] = id;

      db.delete(params, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(true);
      });
    });
  }

  params.ConditionExpression = `${params.ConditionExpression} AND attribute_exists(#s)`;
  params.ExpressionAttributeNames['#s'] = sKey;

  return (pid, sid) => new Promise((resolve, reject) => {
    params.Key[pKey] = pid;
    params.Key[sKey] = sid;
    db.delete(params, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  });
}
