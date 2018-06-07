A simple promisification utility with native promises

## Installation
> `$ yarn add @bhoos/promisify`

## Usage
```javascript
import promisify from '@bhoos/promisify';

// to promisify all from redis client
const client = redis.createClient();
const clientPromised = promisify(client);

// Use without callback methods
const g = await clientPromised.hgetall(key);

// Can also promisify single function
const promised = promisify(function(cb) { ... });
const res = await promised();

```