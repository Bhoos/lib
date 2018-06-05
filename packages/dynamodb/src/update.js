/* eslint-disable no-param-reassign */
function convertObjToExpression(params, obj) {
  // Init params values
  params.UpdateExpression = '';
  params.ExpressionAttributeNames = {};
  params.ExpressionAttributeValues = {};

  let sep = 'SET';

  Object.keys(obj).forEach((name, idx) => {
    const f = `#f${idx}`;
    const v = `:v${idx}`;

    params.UpdateExpression = `${params.UpdateExpression}${sep} ${f}=${v}`;
    params.ExpressionAttributeNames[f] = name;
    params.ExpressionAttributeValues[v] = obj[name];
    sep = ',';
  });
}
/* eslint-enable */ // Renable eslint check

const ATTR_EXISTS_1 = 'attribute_exists(#p)';
const ATTR_EXISTS_2 = `${ATTR_EXISTS_1} AND attribute_exists(#s)`;
const ATTR_NOT_EXISTS_1 = 'attribute_not_exists(#p)';
const ATTR_NOT_EXISTS_2 = `${ATTR_NOT_EXISTS_1} AND attribute_not_exists(#s)`;

export default function update(db, name, { pKey, sKey }) {
  const params = {
    TableName: name,
    Key: {},
    ConditionExpression: sKey ? ATTR_EXISTS_2 : ATTR_EXISTS_1,
  };

  const notExists = sKey ? ATTR_NOT_EXISTS_2 : ATTR_NOT_EXISTS_1;

  const ExpressionAttributeNames = { '#p': pKey };
  if (sKey) {
    params.ConditionExpression = `${params.ConditionExpression} AND attribute_exists(#s)`;
    ExpressionAttributeNames['#s'] = sKey;
  }

  return (record, pid, sid) => new Promise((resolve, reject) => {
    params.Key[pKey] = pid;

    if (sKey) {
      params.Key[sKey] = sid;
    }

    // if the update needs to change either of the pid or sid, then
    // need to get, put and delete
    if (record[pKey] || (sKey && record[sKey])) {
      // The long process
      if (sKey) {
        params.Key[sKey] = sid;
      }

      const existingParams = { TableName: name, Key: params.Key };

      return db.get(existingParams, (err, data) => {
        if (err) {
          return reject(err);
        }
        if (!data.Item) {
          return reject(new Error('Record not found'));
        }

        // Insert the record before deleting
        Object.assign(data.Item, record);
        return db.put({
          TableName: name,
          Item: data.Item,
          ConditionExpression: notExists,
          ExpressionAttributeNames,
        }, (e2) => {
          if (e2) {
            return reject(e2);
          }

          // Delete the record
          return db.delete(existingParams, (e3) => {
            if (e3) {
              return reject(e3);
            }

            return resolve(true);
          });
        });
      });
    }

    // Convert to update expression
    convertObjToExpression(params, record);
    Object.assign(params.ExpressionAttributeNames, ExpressionAttributeNames);

    return db.update(params, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  });
}
