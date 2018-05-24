# app-node
A simple node app life cycle manager with graceful shutdown behaviour.
Works with ES6 only (Node version 6 or more).

# Installation
> `$ npm install app-node`


# Usage
```javascript
import run from 'app-node';
// import run from '@bhoos/lib/node-app';

run(async (app) => {
  // Use app.logger for logging
  app.logger.info('App Started');

  // Get command line arguments (the node and scripts have been trimmed off)
  const port = app.args[0] || 8080;
  await server.listen(port);

  // Set global configuration, for other modules to read
  app.set('port', port);

  // Add exit handlers (like stack)
  app.addExitHandler(() => server.close());

  // Add exit handler at the end (like queue);
  app.appendExitHandler(() => doStuffAtEnd());
});
```

# API
## args
Provides command line argument as an array. Could be extended later
to integrate commander.

## logger
Providers logger (currently uses console).
Use `info`, `warn`, `error`, `debug` for logging

## get/set
Get/Set global configuration

## addExitHandler/appendExitHandler
Add a graceful exit to your app by releasing the resources when your
program exits either via `Ctrl + C` (SIGINT) or a kill (SIGTERM). The
`addExitHandler` adds the cleanup code to a stack (last in first out) 
whereas `appendExitHandler` adds the cleanup code to a queue (last in last out).
