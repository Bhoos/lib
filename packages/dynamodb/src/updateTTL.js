export default function updateTTL(db, name, { all }) {
  return (enabled) => {
    // Search for a field with ttl defined
    const f = Object.keys(all).filter(n => all[n].hasttl);
    if (f.length === 0) {
      throw new Error(`Schema ${name} doesn't have a TTL field defined`);
    } else if (f.length > 1) {
      throw new Error(`Schema ${name} has multiple TTL fields defined`);
    }

    const params = {
      TableName: name,
      TimeToLiveSpecification: {
        AttributeName: f[0],
        Enabled: enabled,
      },
    };

    return db.updateTimeToLive(params).promise().then(data => data.TimeToLiveSpecification);
  };
}
