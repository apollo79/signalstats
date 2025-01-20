import { makePersisted } from "@solid-primitives/storage";
import { Kysely } from "kysely";
import type { DB } from "./db-schema";
import { createSignal } from "solid-js";
import { WaSqliteWorkerDialect } from "~/lib/kysely-wasqlite-worker";
import wasmWorkerUrl from "~/lib/kysely-wasqlite-worker/worker?url";

export const SELF_ID = 2;

export const DB_FILENAME = "signal.sqlite";

export const worker = new Worker(wasmWorkerUrl, {
  type: "module",
});

const dialect = new WaSqliteWorkerDialect({
  fileName: DB_FILENAME,
  preferOPFS: true,
  worker,
});

export const kyselyDb = new Kysely<DB>({
  dialect,
});

export const [dbHash, setDbHash] = makePersisted(createSignal<number>());
