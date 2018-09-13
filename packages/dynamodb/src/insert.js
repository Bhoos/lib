import shortid from 'shortid';

export default function insert(db, name, { keys, pKey }, allowUpdate = false) {
  const params = {
    TableName: name,
  };

  if (!allowUpdate) {
    params.ExpressionAttributeNames = {};
    params.ConditionExpression = keys.map((k) => {
      const f = `#${k.name}`;
      params.ExpressionAttributeNames[f] = k.name;
      return `attribute_not_exists(${f})`;
    }).join(' AND ');
  }

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
