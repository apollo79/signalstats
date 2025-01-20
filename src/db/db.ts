import { makePersisted } from "@solid-primitives/storage";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { Kysely } from "kysely";
import type { DB } from "./db-schema";
import { OfficialWasmDialect } from "kysely-wasm";
import { createSignal } from "solid-js";

export const SELF_ID = 2;

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error,
});

export const db = new sqlite3.oo1.DB("signal");

const dialect = new OfficialWasmDialect({
  database: db,
});

export const kyselyDb = new Kysely<DB>({
  dialect,
});

export const [dbHash, setDbHash] = makePersisted(createSignal<number>());
