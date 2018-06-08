/* eslint-disable no-param-reassign */
function convertObjToExpression(params, obj) {
  // Init params values
  params.UpdateExpression = '';
  params.ExpressionAttributeValues = {};

  let sep = 'SET';

  Object.keys(obj).forEach((name) => {
    const f = `#${name}`;
    const v = `:${name}`;

    params.UpdateExpression = `${params.UpdateExpression}${sep} ${f}=${v}`;
    params.ExpressionAttributeNames[f] = name;
    params.ExpressionAttributeValues[v] = obj[name];
    sep = ',';
  });
}
/* eslint-enable */ // Renable eslint check

export default function update(db, name, { keys, pKey, sKey }) {
  const params = {
    TableName: name,
    Key: {},
    ConditionExpression: keys.map(k => `attribute_exists(#${k.name})`).join(' AND '),
    ExpressionAttributeNames: keys.reduce((res, k) => {
      res[`#${k.name}`] = k.name;
      return res;
    }, {}),
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
    convertObjToExpression(params, record);

    return db.update(params).promise().then(() => true);
  };
}
