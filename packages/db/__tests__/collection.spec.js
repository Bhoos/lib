import createCollection from '../src/createCollection';

function bcrypt(pass) {
  return pass;
}

const User = createCollection('User', ({ key, field }) => ({
  username: key(),
  password: field().setRequired(),
}), ({ self }) => ({
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

const Movies = createCollection('Movie', ({ key }) => ({
  year: key().number(),
  title: key().sort(),
}));

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

    // Delete the record
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

    // Update the record
    await Movies.update({ title: '2K 1 Changed' }, 2000, '2K 1');

    // Make sure the changed record does not exist
    await expect(await Movies.findOne(2000, '2K 1')).toBe(null);
    // Make sure the record is changed
    await expect(await Movies.findOne(2000, '2K 1 Changed')).toEqual({ year: 2000, title: '2K 1 Changed' });
    await Movies.delete(2000, '2K 1 Changed');
    await expect(await Movies.findOne(2000, '2K 1 Changed')).toBe(null);

    // Change other attribute
    expect(await Movies.insert({ year: 2000, title: '2KKK' })).toEqual({ year: 2000, title: '2KKK' });
    expect(await Movies.update({ rating: 9 }, 2000, '2KKK')).toBe(true);

    // Delete the record
    expect(await Movies.delete(2000, '2KKK')).toBe(true);

    // Deleting non existent record should throw
    await expect(User.delete(2000, '2KKK')).rejects.toThrow();
  });
});
