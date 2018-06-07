import { promisify, promisifyAll } from '../src';

function exampleMethodWithoutArgs(cb) {
  cb(null, true);
}

function exampleMethodWithArgs(a, b, cb) {
  cb(null, a + b);
}

function exampleThatThrows(cb) {
  cb(new Error('throw'), null);
}

const arrow = (flag, cb) => (flag ? cb(new Error('err'), null) : cb(null, flag));
const arrowPromise = promisify(arrow);

const obj = {
  member: 'm',
  fn1: (flag, cb) => (flag ? cb(new Error(1), null) : cb(null, 1)),
  fn2: (flag, cb) => (flag ? cb(new Error(2), null) : cb(null, 2)),

  fn3(cb) {
    cb(null, this.member);
  },
};


describe('promisify specification', () => {
  it('check promisify resolution', async () => {
    await expect(promisify(exampleMethodWithoutArgs)()).resolves.toBe(true);
    await expect(promisify(exampleMethodWithArgs)(3, 2)).resolves.toBe(5);
  });

  it('check promisify rejection', async () => {
    await expect(promisify(exampleThatThrows)()).rejects.toThrow('throw');
  });

  it('check arrow function', async () => {
    await expect(arrowPromise(false)).resolves.toBe(false);
    await expect(arrowPromise(true)).rejects.toThrow('err');
  });

  it('check object promisification', async () => {
    const p = promisifyAll(obj);
    await expect(p.fn1(false)).resolves.toBe(1);
    await expect(p.fn2(true)).rejects.toThrow('2');
    await expect(p.fn3()).resolves.toBe(obj.member);
  });
});
