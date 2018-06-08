# @bhoos/dynamodb
DynamoDB wrapper

## Installation
> `$ yarn add @bhoos/dynamodb`

## Usage
### Environment Variables: 
> `AWS_REGION`

> `DYNAMODB_ENDPOINT` [optional]

### Example (Single partition key)
```javascript
import { createCollection } from '@bhoos/dynamodb'

// Create collections as required
// A Simple collection with single key
const User = createCollection('User', ({ key }) => [
  key('username'),
], ({ self }) => {
  get: async (username) => {
    const u = await self.findOne(username);
    const { password, ...res } = u;
    return u;
  },

  create: async (username, password, name) => self.insert({ 
    username, 
    name,
    password: hash(password),
  }),

  validate: async (username, password) => {
    const u = await self.findOne(user);
    if (!u || hash(password) !== u.password) {
      throw new Error('Invalid username/password');
    }

    // It's not a good idea to send back the password, even if its hashed
    const { password, ...res } = u;
    return res;
  },

  changePassword: async (username, password) => {
    // Will throw if the username doesn't exist
    await self.update({ password: hash(password) }, username);
  },

  deleteUser: async (username) => {
    await self.delete(username);
  },
});

// User can now be used with the extended operations
const email = await User.create('john@doe.com', 'SuperSecret', 'John Doe');
const user = await User.get('john@doe.com'); // Retrieve record
await User.validate('john@doe.com', 'Wrong'); // throws error
await User.validate('john@doe.com', 'SuperSecret'); // Returns user instance
await User.deleteUser('john@doe.com'); // Delete from database

// Also available are generic methods- insert, findOne, update, & delete
await User.insert({ username: 'jane@doe.com', password: 'not-hashed', name: 'Jane Doe' }); // Direct
await User.findOne('jane@doe.com');
await User.update({ password: 'not-hashed-new' }, 'jane@doe.com');
await User.delete('jane@doe.com');

```
### Example (Multiple keys)
```javascript
const Movie = createCollection('Movie', ({ key }) => ([
  key('year'),
  key('title'),
}), ({ self, doc }) => ({
  get: (year, title) => self.findOne(year, title),
  findAnnual: (year) => doc.query(.......), // Write your dynamodb query to find something
});

```

### Example (Local Secondary Index)
```javascript
const Thread = createCollection('Thread', ({ key, field }) => ([
  key('forum'),
  key('subject').sort(),
  field('timestamp').local('LastPostIndex'),
]), ({ doc }) => ({
  // Get all recent posts, (with paging)
  getRecentPosts: (forum) => {
    const params = {
      TableName: Thread.name,
      IndexName: 'LastPostIndex',
      KeyConditionExpression: '#forum=:forum',
      ExpressionAttributeNames: { '#forum': 'forum' },
      ExpressionAttributeValues: { ':forum': forum },
      ScanIndexForward: false,
    };

    return doc.query(params).promise().then(data => data.Items);
  },
}));
```

### Example (Global Secondary Index)
```javascript
const GameScore = createCollection('GameScore', ({ key, field }) => ([
  key('UserId'),
  key('GameTitle').sort().global('GameTitleIndex'), // Sort key for main, partition key for global
  field('TopScore').global('GameTitleIndex', true) // Sort key for global index
]), ({ doc }) => ({
  getTopScorer: (title) => {
    const params = {
      TableName: GameScore.name,
      IndexName: 'GameTitleIndex',
      KeyConditionExpression: 'GameTitle = :title',
      ExpressionAttributeValues: { ':title': title },
      ScanIndexForward: false,
    };

    return doc.query(params).promise().then(data => data.Items);
  },
}));
```

### Example (With TTL)
```javascript
const Logs = createCollection('Log', ({ key, field }) => ([
  key('id').auto(),
  field('name'),
  field('expiry').ttl(),
]));

// Run the update ttl after creating the table to enable TTL on expiry
await Logs.updateTTL(true);

// The expiry field can now be set with a future EPOCH time for automatic removal
await Logs.insert({ name: 'Tomorrow', expiry: parseInt(Date.now() / 1000) + 86400 });
await Logs.insert({ name: 'next week', expiry: parseInt(Date.now() / 1000) + 7 * 86400 });
```
