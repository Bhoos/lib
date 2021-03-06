/* eslint-disable no-param-reassign */
function convertObjToExpression(params, obj, keyNames) {
  // Init params values
  params.UpdateExpression = '';
  params.ExpressionAttributeValues = {};
  params.ExpressionAttributeNames = Object.assign({}, keyNames);
  let sep = 'SET';

  Object.keys(obj).forEach((name, idx) => {
    const value = obj[name];

    // skip any undefined values
    if (value === undefined) {
      return;
    }

    const f = `#n${idx}`;
    const v = `:v${idx}`;

    params.UpdateExpression = `${params.UpdateExpression}${sep} ${f}=${v}`;
    params.ExpressionAttributeNames[f] = name;
    params.ExpressionAttributeValues[v] = value;
    sep = ',';
  });
}
/* eslint-enable */ // Renable eslint check

export default function update(db, name, { keys, pKey, sKey }) {
  const keyNames = keys.reduce((res, k) => {
    res[`#${k.name}`] = k.name;
    return res;
  }, {});

  const params = {
    TableName: name,
    Key: {},
    ConditionExpression: keys.map(k => `attribute_exists(#${k.name})`).join(' AND '),
  };

  return (record, pid, sid) => {
    params.Key[pKey.name] = pid;
    if (sKey) {
      params.Key[sKey.name] = sid;
    }

    // if the update needs to change either of the pid or sid, then
    // need to get, put and delete
    if (record[pKey] || (sKey && record[sKey])) {
      throw new Error('Cannot update primary keys');
    }

    // Convert to update expression
    convertObjToExpression(params, record, keyNames);

    return db.update(params).promise().then(() => true);
  };
}
