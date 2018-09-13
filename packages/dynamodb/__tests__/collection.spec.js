import dynamodb from 'aws-db';
import createCollection from '../src/createCollection';

function bcrypt(pass) {
  return pass;
}


function validateDynamoDB() {
  const endPoint = process.env.DYNAMODB_ENDPOINT;
  if (!endPoint) {
    throw new Error('Set your dynamodb endpoint url with DYNAMODB_ENDPOINT env');
  }

  const prefix = 'http://localhost:';
  if (!endPoint.startsWith(prefix)) {
    throw new Error('Tests are supposed to be run with local dynamodb instance');
  }

  const port = parseInt(endPoint.substr(prefix.length), 10);
  if (Number.isNaN(port)) {
    throw new Error('Invalid port');
  }

  return port;
}

const stopMockDB = dynamodb(validateDynamoDB());

/* Create all the test tables */
const User = createCollection('__TEST_User__', ({ key, field }) => ([
  key('username'),
  field('password'),
]), ({ self }) => ({
  create: async (username, password) => self.insert({ username, password: bcrypt(password) }),

  validate: async (username, password) => {
    const rec = await self.findOne({ username });
    if (!rec || rec.password !== bcrypt(password)) {
      throw new Error('Invalid Username/password');
    }

    return { username: rec.username };
  },

  changePassword: async (username, password, newPassword) => {
    const rec = await self.findOne({ username });
    if (!rec || rec.password !== bcrypt(password)) {
      throw new Error('Invalid Username/password');
    }

    self.update({ password: bcrypt(newPassword) }, { username });
    return true;
  },
}));

const Movies = createCollection('__TEST_Movie__', ({ key }) => ([
  key('year').number(),
  key('title').sort(),
]));

const GameScore = createCollection('__TEST_Game__', ({ key, field }) => ([
  key('id').auto(),
  field('game').global('game-user'),
  field('fid').global('game-user', true),
]), ({ doc }) => ({
  gameUsers: (game) => {
    const params = {
      TableName: GameScore.name,
      IndexName: 'game-user',
      KeyConditionExpression: 'game=:game',
      ExpressionAttributeValues: {
        ':game': game,
      },
    };

    return doc.query(params).promise().then(data => data.Items);
  },
}));

const Local = createCollection('__TEST_Local__', ({ key, field }) => ([
  key('game'),
  key('title').sort(),
  field('timestamp').number().local('timed'),
]), ({ doc }) => ({
  query: (game) => {
    const params = {
      TableName: Local.name,
      IndexName: 'timed',
      KeyConditionExpression: 'game=:game',
      ExpressionAttributeValues: {
        ':game': game,
      },
    };

    return doc.query(params).promise().then(data => data.Items);
  },
  find: (game, t) => {
    const params = {
      TableName: Local.name,
      IndexName: 'timed',
      // Key: {
      //   game,
      //   timestamp: `${t}`,
      // },
      KeyConditionExpression: 'game=:game AND #t=:t',
      ExpressionAttributeNames: {
        '#t': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':game': game,
        ':t': t,
      },
    };

    // return doc.get(params).promise().then(data => data.Item);
    return doc.query(params).promise().then(data => (data.Items.length > 0 ? data.Items[0] : null));
  },
}));

const TTL = createCollection('__TEST_ttl__', ({ key, field }) => ([
  key('id').auto(),
  field('name'),
  field('expiry').ttl(),
]));

/* End of creating tables */

/**
  Delete all the tables before starting the test. The dynamodb must have been
  started in memory mode as a local server
*/
afterAll(async () => {
  stopMockDB();
});

describe('createCollection', () => {
  it('checks for all function with single key', async () => {
    await User.createTable();

    // Insert a record, should always return the primary key
    const id = await User.insert({ username: 'U1', password: 'P1' });
    expect(id).toBe('U1');

    // Find the record with the key
    const u = await User.findOne('U1');
    expect(u).toEqual({ username: 'U1', password: 'P1' });

    // Change the value, using update
    await User.update({ password: 'P111' }, 'U1');
    await expect(await User.findOne('U1')).toEqual({ username: 'U1', password: 'P111' });

    // Insert with the same key should fail
    await expect(User.insert({ username: 'U1', password: 'Fail' })).rejects.toThrow();

    // // Delete the record
    await User.delete('U1');
    await expect(await User.findOne('U1')).toBe(null);

    // Update with non existing key should fail
    await expect(User.update({ password: 'P2' }, 'U2')).rejects.toThrow();

    // Upsert should insert a new record
    expect(await User.upsert({ username: 'U2', password: 'P2' })).toBe('U2');

    // Upsert should update an existing record as well
    expect(await User.upsert({ username: 'U2', password: 'changed', name: 'nnn' })).toBe('U2');

    // Delete should throw on non existent record
    await expect(User.delete('U1')).rejects.toThrow();
  });

  it.only('checks for all function with double keys', async () => {
    await Movies.createTable();

    // Insert record
    await Movies.insert({ year: 2000, title: '2K 1' });
    await expect(Movies.insert({ year: 2000, title: '2K 1' })).rejects.toThrow();
    expect(await Movies.upsert({ year: 2000, title: '2K 1', rating: 10 })).toBe(2000);
    expect(await Movies.upsert({ year: 2001, title: '2K1 1' })).toBe(2001);

    // Find the record
    await expect(await Movies.findOne(2000, '2K 1')).toEqual({ year: 2000, title: '2K 1', rating: 10 });
    await expect(await Movies.findOne(2001, '2K1 1')).toEqual({ year: 2001, title: '2K1 1' });

    // Update the record should fail (keys cannot be changed in dynamodb)
    await expect(Movies.update({ title: '2K 1 Changed' }, 2000, '2K 1')).rejects.toThrow();

    await Movies.delete(2000, '2K 1');
    await expect(await Movies.findOne(2000, '2K 1')).toBe(null);

    // Change other attribute
    expect(await Movies.insert({ year: 2000, title: '2KKK' })).toEqual(2000);
    expect(await Movies.update({ rating: 9 }, 2000, '2KKK')).toBe(true);

    // Delete the record
    expect(await Movies.delete(2000, '2KKK')).toBe(true);

    // Deleting non existent record should throw
    await expect(Movies.delete(2000, '2KKK')).rejects.toThrow();
  });

  it('checks for global secondary index usage', async () => {
    await GameScore.createTable();

    // Insert 10 records into game score
    const cnt = 100;
    const res = await Promise.all(new Array(cnt).fill(0).map((n, idx) => (
      GameScore.insert({ game: 'test', fid: `f${idx}` })
    )));
    expect(res.length).toBe(cnt);

    const testId = res[0];
    // Should be able to update the global attribute value
    await GameScore.update({ game: 'change', fid: 'changed-id' }, testId);
    expect(await GameScore.findOne(testId)).toMatchObject({ game: 'change', fid: 'changed-id' });

    // Try the query with global index
    const gameUsers = await GameScore.gameUsers('test');
    expect(gameUsers).toHaveLength(cnt - 1);
  });

  it('checks for local secondary index usage', async () => {
    await Local.createTable();

    // Insert some data
    await Local.insert({ game: 'test', title: 'One', timestamp: 1 });
    await Local.insert({ game: 'test', title: 'Two', timestamp: 2 });

    // Run query via the local secondary index
    const res = await Local.query('test');
    expect(res).toHaveLength(2);

    // Search via a local secondary index
    const r = await Local.find('test', 2);
    expect(r).toMatchObject({ game: 'test', title: 'Two', timestamp: 2 });
  });

  it('checks for time to live specification', async () => {
    await TTL.createTable();
    await TTL.updateTTL(true);

    // Insert a record without expiry
    const nid = await TTL.insert({ name: 'Jane' });

    const id = await TTL.insert({ name: 'John', expiry: Math.floor(Date.now() / 1000) });
    expect(await TTL.findOne(id)).toMatchObject({ name: 'John' });

    // Run after a second, to ensure the record has been remove
    await new Promise(resolve => setTimeout(resolve, 4000));
    expect(await TTL.findOne(id)).toBe(null);

    // The one without expiry should still be there
    expect(await TTL.findOne(nid)).toMatchObject({ name: 'Jane' });
  });
});
