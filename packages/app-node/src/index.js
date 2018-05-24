const cleaners = [];

export default async function run(starter) {
  const args = process.argv.slice(2);
  const config = {};

  const app = {
    logger: console,

    args,

    set: (name, value) => {
      config[name] = value;
    },

    get: name => config[name],

    configure: (obj) => {
      Object.assign(config, obj);
    },

    addExitHandler: (cleaner) => {
      cleaners.unshift(cleaner);
    },

    appendExitHandler: (cleaner) => {
      cleaners.push(cleaner);
    },

    exit: () => {
      // Emit a termination signal
      process.emit('SIGTERM');
    },
  };

  async function shutdown() {
    app.logger.info('Shutting down gracefully');

    // Run all the cleaners before shutting down
    await cleaners.reduce((res, cleaner) => (
      res.then(() => cleaner())
    ), Promise.resolve(null));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await starter(app);
  } catch (e) {
    app.logger.error(e);

    // Perform a shutdown
    shutdown();
  }

  // Return the app instance
  return app;
}
