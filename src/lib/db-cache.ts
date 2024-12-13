import { createEffect, on } from "solid-js";

const DATABASE_HASH_PREFIX = "database";

// clear the cache on new session so that selecting a different database does not result in wrong cache entries
const clearDbCache = () => {
  for (let i = 0, len = localStorage.length; i < len; i++) {
    const key = localStorage.key(i);

    if (key?.startsWith(DATABASE_HASH_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
};

// https://stackoverflow.com/a/7616484
const hashString = (str: string) => {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const HASH_STORE_KEY = "database_hash";

// cannot import `db` the normal way because this file is imported in ~/db.ts before the initialisation of `db` has happened
queueMicrotask(() => {
  void import("~/db").then(({ db }) => {
    createEffect(
      on(db, (currentDb) => {
        if (currentDb) {
          const newHash = hashString(new TextDecoder().decode(currentDb.export())).toString();

          const oldHash = localStorage.getItem(HASH_STORE_KEY);

          console.log(newHash, oldHash);

          if (newHash !== oldHash) {
            clearDbCache();

            localStorage.setItem(HASH_STORE_KEY, newHash);
          }
        }
      }),
    );
  });
});

class LocalStorageCacheAdapter {
  keys = new Set<string>(Object.keys(localStorage).filter((key) => key.startsWith(this.prefix)));
  prefix = "database";

  #createKey(cacheName: string, key: string): string {
    return `${this.prefix}-${cacheName}-${key}`;
  }

  set(cacheName: string, key: string, value: unknown) {
    const fullKey = this.#createKey(cacheName, key);
    this.keys.add(fullKey);

    localStorage.setItem(fullKey, JSON.stringify(value));
  }

  has(cacheName: string, key: string): boolean {
    return this.keys.has(this.#createKey(cacheName, key));
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get<R>(cacheName: string, key: string): R | undefined {
    const item = localStorage.getItem(this.#createKey(cacheName, key));
    if (item) {
      return JSON.parse(item) as R;
    }
  }
}

const cache = new LocalStorageCacheAdapter();

export const cached = <T extends unknown[], R, TT>(fn: (...args: T) => R, self?: ThisType<TT>): ((...args: T) => R) => {
  const cacheName = hashString(fn.toString()).toString();

  // important to return a promise on follow-up calls even if the data is immediately available
  let isPromise: boolean;

  return (...args: T) => {
    const cacheKey = JSON.stringify(args);

    const cachedValue = cache.get<R>(cacheName, cacheKey);

    if (cachedValue) {
      return (isPromise ? Promise.resolve(cachedValue) : cachedValue) as R;
    }

    let newValue: R;

    if (self) {
      newValue = fn.apply(self, args);
    } else {
      newValue = fn(...args);
    }

    const promisified = Promise.resolve(newValue);

    isPromise = promisified == newValue;

    void promisified.then((result) => {
      cache.set(cacheName, cacheKey, result);
    });

    return newValue;
  };
};
