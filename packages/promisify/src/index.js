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
  Object.keys(obj).forEach((key) => {
    const fn = obj[key];
    if (typeof fn === 'function') {
      res[key] = promisify(fn, obj);
    }
  });
  return res;
}

export default function (a) {
  if (typeof (a) === 'function') {
    return promisify(a);
  } else if (typeof (a) === 'object') {
    return promisifyAll(a);
  }
  throw new Error(`Cannot promisify ${a}`);
}
