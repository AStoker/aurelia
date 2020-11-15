import { IIndexable } from '@aurelia/kernel';
import { watching, currentWatcher } from './watcher-switcher';

const R$get = Reflect.get;
const proxyMap = new WeakMap<object, object>();

export const rawKey = '__raw__';

export function getProxyOrSelf<T extends unknown>(v: T): T {
  return v instanceof Object ? getProxy(v) : v;
}
export function getProxy<T extends object>(obj: T): T {
  // deepscan-disable-next-line
  return proxyMap.get(obj) as T ?? createProxy(obj);
}

export function getRaw<T extends object>(obj: T): T {
  // todo: get in a weakmap if null/undef
  return (obj as IIndexable)[rawKey] as T ?? obj;
}
export function getRawOrSelf<T extends unknown>(v: T): T {
  return v instanceof Object ? (v as IIndexable)[rawKey] as T : v;
}

function doNotCollect(key: PropertyKey): boolean {
  return key === 'constructor'
    || key === '__proto__'
    // probably should revert to v1 naming style for consistency with builtin?
    // __o__ is shorters & less chance of conflict with other libs as well
    || key === 'observers'
    || key === Symbol.toPrimitive
    || key === Symbol.toStringTag;
}

function createProxy<T extends object>(obj: T): T {
  const handler: ProxyHandler<object> = obj instanceof Array
    ? arrayHandler
    : obj instanceof Map || obj instanceof Set
      ? collectionHandler
      : objectHandler;

  const proxiedObj = new Proxy(obj, handler);
  proxyMap.set(obj, proxiedObj);

  return proxiedObj as T;
}

const objectHandler: ProxyHandler<object> = {
  get(target: IIndexable, key: PropertyKey, receiver: object): unknown {
    // maybe use symbol?
    if (key === rawKey) {
      return target;
    }

    const connectable = currentWatcher();

    if (!watching || doNotCollect(key) || connectable == null) {
      return R$get(target, key, receiver);
    }

    // todo: static
    connectable.observe(target, key);

    return getProxyOrSelf(R$get(target, key, receiver));
  },
};

const arrayHandler: ProxyHandler<unknown[]> = {
  get(target: unknown[], key: PropertyKey, receiver: unknown): unknown {
    // maybe use symbol?
    if (key === rawKey) {
      return target;
    }

    const connectable = currentWatcher();

    if (!watching || doNotCollect(key) || connectable == null) {
      return R$get(target, key, receiver);
    }

    switch (key) {
      case 'length':
        connectable.observeLength(target);
        return target.length;
      case 'map':
        return wrappedArrayMap;
      case 'includes':
        return wrappedArrayIncludes;
      case 'indexOf':
        return wrappedArrayIndexOf;
      case 'lastIndexOf':
        return wrappedArrayLastIndexOf;
      case 'every':
        return wrappedArrayEvery;
      case 'filter':
        return wrappedArrayFilter;
      case 'findIndex':
        return wrappedArrayFindIndex;
      case 'flat':
        return wrappedArrayFlat;
      case 'flatMap':
        return wrappedArrayFlatMap;
      case 'join':
        return wrappedArrayJoin;
      case 'push':
        return wrappedArrayPush;
      case 'pop':
        return wrappedArrayPop;
      case 'reduce':
        return wrappedReduce;
      case 'reduceRight':
        return wrappedReduceRight;
      case 'reverse':
        return wrappedArrayReverse;
      case 'shift':
        return wrappedArrayShift;
      case 'unshift':
        return wrappedArrayUnshift;
      case 'slice':
        return wrappedArraySlice;
      case 'splice':
        return wrappedArraySplice;
      case 'some':
        return wrappedArraySome;
      case 'keys':
        return wrappedKeys;
      case 'values':
      case Symbol.iterator:
        return wrappedValues;
      case 'entries':
        return wrappedEntries;
    }

    connectable.observe(target, key);

    return getProxyOrSelf(R$get(target, key, receiver));
  },
  // for (let i in array) ...
  ownKeys(target: unknown[]): PropertyKey[] {
    currentWatcher()?.observeLength(target);
    return Reflect.ownKeys(target);
  },
};

function wrappedArrayMap(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => unknown, thisArg?: unknown): unknown {
  const raw = getRaw(this);
  const res = raw.map((v, i) =>
    // do we wrap `thisArg`?
    getRawOrSelf(cb.call(thisArg, getProxyOrSelf(v), i, this))
  );
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(res);
}

function wrappedArrayEvery(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => unknown, thisArg?: unknown): boolean {
  const raw = getRaw(this);
  const res = raw.every((v, i) => cb.call(thisArg, getProxyOrSelf(v), i, this));
  currentWatcher()?.observeCollection(raw);
  return res;
}

function wrappedArrayFilter(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => boolean, thisArg?: unknown): unknown[] {
  const raw = getRaw(this);
  const res = raw.filter((v, i) =>
    // do we wrap `thisArg`?
    getRawOrSelf(cb.call(thisArg, getProxyOrSelf(v), i, this))
  );
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(res);
}

function wrappedArrayIncludes(this: unknown[], v: unknown): boolean {
  const raw = getRaw(this);
  const res = raw.includes(getRawOrSelf(v));
  currentWatcher()?.observeCollection(raw);
  return res;
}

function wrappedArrayIndexOf(this: unknown[], v: unknown): number {
  const raw = getRaw(this);
  const res = raw.indexOf(getRawOrSelf(v));
  currentWatcher()?.observeCollection(raw);
  return res;
}
function wrappedArrayLastIndexOf(this: unknown[], v: unknown): number {
  const raw = getRaw(this);
  const res = raw.lastIndexOf(getRawOrSelf(v));
  currentWatcher()?.observeCollection(raw);
  return res;
}
function wrappedArrayFindIndex(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => boolean, thisArg?: unknown): number {
  const raw = getRaw(this);
  const res = raw.findIndex((v, i) => getRawOrSelf(cb.call(thisArg, getProxyOrSelf(v), i, this)));
  currentWatcher()?.observeCollection(raw);
  return res;
}

function wrappedArrayFlat(this: unknown[]): unknown[] {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(raw.flat());
}
function wrappedArrayFlatMap(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => unknown, thisArg?: unknown): unknown[] {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return getProxy(raw.flatMap((v, i) =>
    getProxyOrSelf(cb.call(thisArg, getProxyOrSelf(v), i, this)))
  );
}
function wrappedArrayJoin(this: unknown[], separator?: string): string {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return raw.join(separator);
}

function wrappedArrayPop(this: unknown[]): unknown {
  return getProxyOrSelf(getRaw(this).pop());
}
function wrappedArrayPush(this: unknown[], ...args: unknown[]): number {
  return getRaw(this).push(...args);
}
function wrappedArrayShift(this: unknown[]): unknown {
  return getProxyOrSelf(getRaw(this).shift());
}
function wrappedArrayUnshift(this: unknown[], ...args: unknown[]): unknown {
  return getRaw(this).unshift(...args);
}
function wrappedArraySplice(this: unknown[], ...args: [number, number, ...unknown[]]): unknown {
  return getProxyOrSelf(getRaw(this).splice(...args));
}
function wrappedArrayReverse(this: unknown[], ...args: unknown[]): unknown[] {
  const raw = getRaw(this);
  const res = raw.reverse();
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(res);
}

function wrappedArraySome(this: unknown[], cb: (v: unknown, i: number, arr: unknown[]) => boolean, thisArg?: unknown): boolean {
  const raw = getRaw(this);
  const res = raw.some((v, i) => getRawOrSelf(cb.call(thisArg, getProxyOrSelf(v), i, this)));
  currentWatcher()?.observeCollection(raw);
  return res;
}

function wrappedArraySlice(this: unknown[], start?: number, end?: number): unknown[] {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return getProxy(raw.slice(start, end));
}

function wrappedReduce(this: unknown[], cb: (curr: unknown, v: unknown, i: number, arr: unknown[]) => unknown, initValue: unknown): unknown {
  const raw = getRaw(this);
  const res = raw.reduce((curr, v, i) => cb(curr, getProxyOrSelf(v), i, this), initValue);
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(res);
}

function wrappedReduceRight(this: unknown[], cb: (curr: unknown, v: unknown, i: number, arr: unknown[]) => unknown, initValue: unknown): unknown {
  const raw = getRaw(this);
  const res = raw.reduceRight((curr, v, i) => cb(curr, getProxyOrSelf(v), i, this), initValue);
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(res);
}

// the below logic takes inspiration from Vue, Mobx
// much thanks to them for working out this
const collectionHandler: ProxyHandler<$MapOrSet> = {
  get(target: $MapOrSet, key: PropertyKey, receiver?): unknown {
    // maybe use symbol?
    if (key === rawKey) {
      return target;
    }

    const connectable = currentWatcher();

    if (!watching || doNotCollect(key) || connectable == null) {
      return R$get(target, key, receiver);
    }

    switch (key) {
      case 'size':
        connectable.observeLength(target);
        return target.size;
      case 'clear':
        return wrappedClear;
      case 'delete':
        return wrappedDelete;
      case 'forEach':
        return wrappedForEach;
      case 'add':
        if (target instanceof Set) {
          return wrappedAdd;
        }
        break;
      case 'get':
        if (target instanceof Map) {
          return wrappedGet;
        }
        break;
      case 'set':
        if (target instanceof Map) {
          return wrappedSet;
        }
        break;
      case 'has':
        return wrappedHas;
      case 'keys':
        return wrappedKeys;
      case 'values':
        return wrappedValues;
      case 'entries':
        return wrappedEntries;
      case Symbol.iterator:
        return target instanceof Map ? wrappedEntries : wrappedValues;
    }

    return getProxyOrSelf(R$get(target, key, receiver));
  },
};

type $MapOrSet = Map<unknown, unknown> | Set<unknown>;
type CollectionMethod = (this: unknown, ...args: unknown[]) => unknown;

function wrappedForEach(this: $MapOrSet, cb: CollectionMethod, thisArg?: unknown): void {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return raw.forEach((v: unknown, key: unknown) => {
    cb.call(/* should wrap or not?? */thisArg, getProxyOrSelf(v), getProxyOrSelf(key), this);
  });
}

function wrappedHas(this: $MapOrSet, v: unknown): boolean {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return raw.has(getRawOrSelf(v));
}

function wrappedGet(this: Map<unknown, unknown>, k: unknown): unknown {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  return getProxyOrSelf(raw.get(getRawOrSelf(k)));
}
function wrappedSet(this: Map<unknown, unknown>, k: unknown, v: unknown): Map<unknown, unknown> {
  return getProxyOrSelf(getRaw(this).set(getRawOrSelf(k), getRawOrSelf(v)));
}

function wrappedAdd(this: Set<unknown>, v: unknown): Set<unknown> {
  return getProxyOrSelf(getRaw(this).add(getRawOrSelf(v)));
}

function wrappedClear(this: $MapOrSet): void {
  return getProxyOrSelf(getRaw(this).clear());
}

function wrappedDelete(this: $MapOrSet, k: unknown): boolean {
  return getProxyOrSelf(getRaw(this).delete(getRawOrSelf(k)));
}

function wrappedKeys(this: $MapOrSet | unknown[]): IterableIterator<unknown> {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  const iterator = raw.keys();

  return {
    next(): IteratorResult<unknown, unknown> {
      const next = iterator.next();
      const value = next.value;
      const done = next.done;

      return done
        ? { value: void 0, done }
        : { value: getProxyOrSelf(value), done };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

function wrappedValues(this: $MapOrSet | unknown[]): IterableIterator<unknown> {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  const iterator = raw.values();

  return {
    next(): IteratorResult<unknown, unknown> {
      const next = iterator.next();
      const value = next.value;
      const done = next.done;

      return done
        ? { value: void 0, done }
        : { value: getProxyOrSelf(value), done };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

function wrappedEntries(this: $MapOrSet | unknown[]): IterableIterator<unknown> {
  const raw = getRaw(this);
  currentWatcher()?.observeCollection(raw);
  const iterator = raw.entries();

  // return a wrapped iterator which returns observed versions of the
  // values emitted from the real iterator
  return {
    next(): IteratorResult<unknown, unknown> {
      const next = iterator.next();
      const value = next.value;
      const done = next.done;

      return done
        ? { value: void 0, done }
        : { value: [getProxyOrSelf(value[0]), getProxyOrSelf(value[1])], done };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

export const ProxyObservable = Object.freeze({
  getProxy,
  getRaw,
});
