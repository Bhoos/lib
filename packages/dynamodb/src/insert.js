import shortid from 'shortid';

export default function insert(db, name, { keys, pKey }) {
  const params = {
    TableName: name,
    ConditionExpression: keys.map(k => `attribute_not_exists(#${k.name})`).join(' AND '),
    ExpressionAttributeNames: keys.reduce((res, k) => {
      res[`#${k.name}`] = k.name;
      return res;
    }, {}),
  };

  return (record) => {
    if (pKey.isAuto && !record[pKey.name]) {
      // eslint-disable-next-line no-param-reassign
      record[pKey.name] = shortid();
    }
    const pid = record[pKey.name];

    params.Item = record;


    // TODO: Check for condition expression failure, specially when key is auto generated
    return db.put(params).promise().then(() => pid);
  };
}
