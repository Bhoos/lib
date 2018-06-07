export function promisify(fn, context = fn) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(context, [...args, (err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]);
  });
}

export function promisifyAll(obj) {
  const res = {};
  Object.keys(obj).forEach((key) => {
    const fn = obj[key];
    if (typeof fn === 'function') {
      res[key] = promisify(fn, obj);
    }
  });
  return res;
}
