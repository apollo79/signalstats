import asyncWasmUrl from "~/assets/wa-sqlite-async.wasm?url";
import syncWasmUrl from "~/assets/wa-sqlite.wasm?url";

export function parseWorkerOrURL<T, P extends T | ((is: boolean) => T)>(obj: P, is: boolean): T {
  return typeof obj === "function" ? obj(is) : obj;
}

/**
 * auto load target worker
 *
 * **only basic worker options**
 */
export function defaultWorker(support: boolean): Worker {
  return support
    ? new Worker(new URL("worker.mjs", import.meta.url), { type: "module" })
    : new Worker(new URL("worker.js", import.meta.url));
}

/**
 * auto load target wasm
 */
export function defaultWasmURL(useAsyncWasm: boolean): string {
  return useAsyncWasm ? asyncWasmUrl : syncWasmUrl;
}
