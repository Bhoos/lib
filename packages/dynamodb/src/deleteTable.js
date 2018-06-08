export default function createTable(db, name) {
  return () => {
    const params = {
      TableName: name,
    };

    return db.deleteTable(params).promise();
  };
}
