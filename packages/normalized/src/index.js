// @flow

export type Entity = {
  id: string,
};

export type NormalizedState<T: Entity> = {
  allIds: Array<string>,
  byId: {
    [string]: T,
  },
};

export type UpdateFn<T: Entity> = (T, number, Array<string>) => T;

export function create<T: Entity>(items: Array<T>, initial?: T) {
  return {
    allIds: items.map(item => item.id),
    byId: items.reduce((res, item) => ({
      ...res,
      [item.id]: {
        ...initial,
        ...item,
      },
    }), {}),
  };
}

export function concat<T: Entity>(state: NormalizedState<T>, item: T) {
  return {
    allIds: state.allIds.concat(item.id),
    byId: {
      ...state.byId,
      [item.id]: item,
    },
  };
}

export function update<T: Entity>(
  state: NormalizedState<T>,
  updateId: string,
  updater: UpdateFn<T>
) {
  return {
    allIds: state.allIds,
    byId: state.allIds.reduce((res, id, idx, src) => ({
      ...res,
      [id]: id !== updateId ? state.byId[id] : updater(state.byId[id], idx, src),
    }), {}),
  };
}

export function updateAll<T: Entity>(state: NormalizedState<T>, updater: UpdateFn<T>) {
  return {
    allIds: state.allIds,
    byId: state.allIds.reduce((res, id, idx, src) => ({
      ...res,
      [id]: updater(state.byId[id], idx, src),
    }), {}),
  };
}

export function map<T: Entity>(state: NormalizedState<T>, fn: UpdateFn<T>) {
  return state.allIds.map((id, idx, src) => fn(state.byId[id], idx, src));
}

export type TruthyFn<T: Entity> = (T, number, Array<string>) => boolean;

export function count<T: Entity>(state: NormalizedState<T>, fn: TruthyFn<T>) {
  return state.allIds.reduce((res, id, idx, src) => (
    fn(state.byId[id], idx, src) ? res + 1 : res
  ), 0);
}
