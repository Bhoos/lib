export default function findOne(db, name, { pKey, sKey }) {
  const params = {
    TableName: name,
    Key: {},
  };

  // For schema with just a primary key, use a simple function
  if (!sKey) {
    return (id) => {
      params.Key[pKey.name] = id;
      return db.get(params).promise().then(data => data.Item || null);
    };
  }

  return (pid, sid) => {
    params.Key[pKey.name] = pid;
    params.Key[sKey.name] = sid;
    return db.get(params).promise().then(data => data.Item || null);
  };
}
