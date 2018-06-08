export default function remove(db, name, { pKey, sKey, keys }) {
  const params = {
    TableName: name,
    Key: {},
    ConditionExpression: keys.map(k => `attribute_exists(#${k.name})`).join(' AND '),
    ExpressionAttributeNames: keys.reduce((res, k) => {
      res[`#${k.name}`] = k.name;
      return res;
    }, {}),
  };

  if (sKey) {
    return (pid, sid) => {
      params.Key[pKey.name] = pid;
      params.Key[sKey.name] = sid;
      return db.delete(params).promise().then(() => true);
    };
  }

  return (pid) => {
    params.Key[pKey.name] = pid;
    return db.delete(params).promise(() => true);
  };
}
