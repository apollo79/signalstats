import { Kysely } from "kysely";
import type { DB } from "./db-schema";
import { OfficialWasmWorkerDialect } from "~/lib/kysely-official-wasm-worker";
import WasmWorker from "./db-worker?worker";
import { createSignal } from "solid-js";

export const SELF_ID = 2;

export const DB_FILENAME = "signal.sqlite";

export const worker = new WasmWorker();

const dialect = new OfficialWasmWorkerDialect({
  fileName: DB_FILENAME,
  preferOPFS: true,
  worker,
});

export const kyselyDb = new Kysely<DB>({
  dialect,
});

export const [dbLoaded, setDbLoaded] = createSignal(false);
// export const [dbHash, setDbHash] = makePersisted(createSignal<number>());
