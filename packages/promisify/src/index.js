function promisify(fn, context = fn) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(context, [...args, (err, res) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    }]);
  });
}

function promisifyAll(obj) {
  const res = {};
  // eslint-disable-next-line
  for (let key in obj) {
    const fn = obj[key];
    if (typeof fn === 'function') {
      res[key] = promisify(fn, obj);
    }
  }
  return res;
}

export default function (a, context = a) {
  if (typeof (a) === 'function') {
    return promisify(a, context);
  } else if (typeof (a) === 'object') {
    return promisifyAll(a);
  }
  throw new Error(`Cannot promisify ${a}`);
}
