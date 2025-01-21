import { deserialize, serialize } from "seroval";
import { hashString } from "./hash";

export const DATABASE_HASH_PREFIX = "database";

export const hasCashedData = () => {
  for (let i = 0, len = localStorage.length; i < len; i++) {
    const key = localStorage.key(i);

    if (key?.startsWith(DATABASE_HASH_PREFIX)) {
      return true;
    }
  }

  return false;
};

// clear the cache on new session so that selecting a different database does not result in wrong cache entries
export const clearDbCache = () => {
  for (let i = 0, len = localStorage.length; i < len; i++) {
    const key = localStorage.key(i);

    if (key?.startsWith(DATABASE_HASH_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
};

class LocalStorageCacheAdapter {
  keys = new Set<string>(Object.keys(localStorage).filter((key) => key.startsWith(DATABASE_HASH_PREFIX)));

  #createKey(cacheName: string, key: string): string {
    return `${DATABASE_HASH_PREFIX}-${cacheName}-${key}`;
  }

  set(cacheName: string, key: string, value: unknown, isPromise = false) {
    const fullKey = this.#createKey(cacheName, key);
    this.keys.add(fullKey);

    try {
      localStorage.setItem(fullKey, serialize({ isPromise, value }));
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "QUOTA_EXCEEDED_ERR") {
        console.error("Storage quota exceeded, not caching new function calls");
      } else {
        console.error(error);
      }
    }
  }

  has(cacheName: string, key: string): boolean {
    return this.keys.has(this.#createKey(cacheName, key));
  }

  get<R>(
    cacheName: string,
    key: string,
  ):
    | {
        isPromise: boolean;
        value: R;
      }
    | undefined {
    const item = localStorage.getItem(this.#createKey(cacheName, key));

    if (item) {
      return deserialize(item) as {
        isPromise: boolean;
        value: R;
      };
    }
  }
}

const cache = new LocalStorageCacheAdapter();

const createHashKey = (...args: unknown[]) => {
  let stringToHash = "";

  for (const arg of args) {
    switch (typeof arg) {
      case "string":
        stringToHash += arg;
        break;
      case "number":
      case "bigint":
      case "symbol":
      case "function":
        stringToHash += arg.toString();
        break;
      case "boolean":
      case "undefined":
        stringToHash += String(arg);
        break;
      case "object":
        stringToHash += JSON.stringify(arg);
        break;
    }
  }

  return hashString(stringToHash);
};

type CachedFn<T extends unknown[], R> = ((...args: T) => R) & {
  hasCacheFor: (...args: T) => boolean;
};

export const cached = <T extends unknown[], R, TT>(fn: (...args: T) => R, self?: ThisType<TT>): CachedFn<T, R> => {
  const cacheName = hashString(fn.toString()).toString();

  const cachedFn: CachedFn<T, R> = (...args: T) => {
    const cacheKey = createHashKey(...args).toString();

    const cachedValue = cache.get<R>(cacheName, cacheKey);

    if (cachedValue) {
      return (cachedValue.isPromise ? Promise.resolve(cachedValue.value) : cachedValue.value) as R;
    }

    let newValue: R;

    if (self) {
      newValue = fn.apply(self, args);
    } else {
      newValue = fn(...args);
    }

    const promisified = Promise.resolve(newValue);

    const isPromise = promisified == newValue;

    void promisified.then((result) => {
      if (result !== undefined) {
        cache.set(cacheName, cacheKey, result, isPromise);
      }
    });

    return newValue;
  };

  cachedFn.hasCacheFor = (...args: T) => {
    const cacheKey = createHashKey(...args).toString();

    return cache.has(cacheName, cacheKey);
  };

  return cachedFn;
};
