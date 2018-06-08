import createCollection from '../src/createCollection';

function bcrypt(pass) {
  return pass;
}


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

beforeAll(async () => {
  try {
    await Promise.all([
      User.deleteTable(),
      Movies.deleteTable(),
      GameScore.deleteTable(),
      Local.deleteTable(),
    ]);
  } catch (e) {
    console.warn('HIGHLY LIKELY', e.message);
  }
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

    // Delete should throw on non existent record
    await expect(User.delete('U1')).rejects.toThrow();
  });

  it('checks for all function with double keys', async () => {
    await Movies.createTable();

    // Insert record
    await Movies.insert({ year: 2000, title: '2K 1' });
    // Find the record
    await expect(await Movies.findOne(2000, '2K 1')).toEqual({ year: 2000, title: '2K 1' });

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

    await Local.insert({ game: 'test', title: 'One', timestamp: 1 });
    await Local.insert({ game: 'test', title: 'Two', timestamp: 2 });

    const res = await Local.query('test');
    expect(res).toHaveLength(2);

    const r = await Local.find('test', 2);
    expect(r).toMatchObject({ game: 'test', title: 'Two', timestamp: 2 });
  });
});
