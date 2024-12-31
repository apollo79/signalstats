import { makePersisted } from "@solid-primitives/storage";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { Kysely } from "kysely";
import type { DB } from "kysely-codegen";
import { OfficialWasmDialect } from "kysely-wasm";
import { createSignal } from "solid-js";
import workerUrl from "./lib/kysely-official-wasm-worker/worker?url";

export const SELF_ID = 2;

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error,
});

export const db = new sqlite3.oo1.DB("signal");

export const worker = new Worker(workerUrl, {
  type: "module",
});

const dialect = new OfficialWasmDialect({
  database: db,
});

export const kyselyDb = new Kysely<DB>({
  dialect,
});

export const [dbHash, setDbHash] = makePersisted(createSignal<number>());
