import { createEffect, createMemo, createRoot, createSignal } from "solid-js";

import { Kysely } from "kysely";
import type { DB } from "kysely-codegen";
import { SqlJsDialect } from "kysely-wasm";
import initSqlJS, { type Database } from "sql.js";

import wasmURL from "./assets/sql-wasm.wasm?url";

export const SELF_ID = 2;

export const SQL = await initSqlJS({
  locateFile: () => wasmURL,
});

export const [db, setDb] = createSignal<Database | undefined>();

const sqlJsDialect = () => {
  const currentDb = db();

  if (currentDb) {
    return new SqlJsDialect({
      database: currentDb,
    });
  }
};

export const kyselyDb = createRoot(() => {
  createEffect(() => {
    const currentDb = db();

    if (currentDb) {
      currentDb.create_function("is_not_empty", (str: string | null) => {
        return str !== null && str !== "";
      });
    }
  });

  return createMemo(() => {
    const currentSqlJsDialect = sqlJsDialect();

    if (!currentSqlJsDialect) {
      return;
    }

    return new Kysely<DB>({
      dialect: currentSqlJsDialect,
    });
  });
});
