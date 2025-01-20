import { deserialize, serialize } from "seroval";
import {} from "solid-js";
import { hashString } from "./hash";

export const DATABASE_HASH_PREFIX = "database";

// clear the cache on new session so that selecting a different database does not result in wrong cache entries
// const clearDbCache = () => {
//   for (let i = 0, len = localStorage.length; i < len; i++) {
//     const key = localStorage.key(i);

//     if (key?.startsWith(DATABASE_HASH_PREFIX)) {
//       localStorage.removeItem(key);
//     }
//   }
// };

// let prevDbHash = dbHash();

// createRoot(() => {
//   createEffect(() => {
//     on(
//       dbHash,
//       (currentDbHash) => {
//         if (currentDbHash && currentDbHash !== prevDbHash) {
//           prevDbHash = currentDbHash;
//           clearDbCache();
//         }
//       },
//       {
//         defer: true,
//       },
//     );
//   });
// });

class LocalStorageCacheAdapter {
  keys = new Set<string>(Object.keys(localStorage).filter((key) => key.startsWith(this.prefix)));
  prefix = "database";
  // TODO: real way of detecting if the db is loaded, on loading the db and opfs (if persisted db?)
  // #dbLoaded = createMemo(() => !!dbHash());

  #createKey(cacheName: string, key: string): string {
    return `${this.prefix}-${cacheName}-${key}`;
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
    // if (this.#dbLoaded()) {
    return this.keys.has(this.#createKey(cacheName, key));
    // }

    // console.info("No database loaded");

    // return false;
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
    // if (this.#dbLoaded()) {
    const item = localStorage.getItem(this.#createKey(cacheName, key));

    if (item) {
      return deserialize(item) as {
        isPromise: boolean;
        value: R;
      };
    }
    // } else {
    //   console.info("No database loaded");
    // }
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

export const cached = <T extends unknown[], R, TT>(fn: (...args: T) => R, self?: ThisType<TT>): ((...args: T) => R) => {
  const cacheName = hashString(fn.toString()).toString();

  return (...args: T) => {
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
};
