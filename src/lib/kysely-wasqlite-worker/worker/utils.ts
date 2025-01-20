import type { SQLiteDB } from "@subframe7536/sqlite-wasm";
import type { QueryResult } from "kysely";
import type { MainToWorkerMsg, WorkerToMainMsg } from "../type";
import { initSQLite } from "@subframe7536/sqlite-wasm";
import { defaultWasmURL, parseWorkerOrURL } from "../utils";

let db: SQLiteDB;

async function init(
  fileName: string,
  url: string,
  useOPFS: boolean,
  afterInit?: (sqliteDB: SQLiteDB) => Promise<void>,
): Promise<void> {
  db = await initSQLite(
    (useOPFS
      ? (await import("@subframe7536/sqlite-wasm/opfs")).useOpfsStorage
      : (await import("@subframe7536/sqlite-wasm/idb")).useIdbStorage)(fileName, { url }),
  );
  await afterInit?.(db);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function exec(isSelect: boolean, sql: string, parameters?: readonly unknown[]): Promise<QueryResult<any>> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const rows = await db.run(sql, parameters as any[]);
  return isSelect || rows.length
    ? { rows }
    : {
        rows,
        insertId: BigInt(db.lastInsertRowId()),
        numAffectedRows: BigInt(db.changes()),
      };
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function stream(onData: (data: any) => void, sql: string, parameters?: readonly unknown[]): Promise<void> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  await db.stream(onData, sql, parameters as any[]);
}

async function loadDb(onData: (percentage: number) => void, fileName: string, useOPFS: boolean, statements: string[]) {
  if (!db) {
    await init(fileName, parseWorkerOrURL(defaultWasmURL, !useOPFS) as string, useOPFS);
  }

  const length = statements.length;
  let percentage = 0;

  for (let i = 0; i < length; i += 1000) {
    const newPercentage = Math.round((i / length) * 100);

    if (newPercentage !== percentage) {
      onData(newPercentage);

      percentage = newPercentage;
    }

    console.log("executing statement");

    await db.run(statements.slice(i, i + 1000).join(";"));
  }

  // await db.run(statements.join(";"));
}

/**
 * Handle worker message, support custom callback on initialization
 * @example
 * // worker.ts
 * import { createOnMessageCallback, customFunction } from 'kysely-wasqlite-worker'
 *
 * onmessage = createOnMessageCallback(
 *   async (sqliteDB: SQLiteDB) => {
 *     customFunction(sqliteDB.sqlite, sqliteDB.db, 'customFunction', (a, b) => a + b)
 *   }
 * )
 */
export function createOnMessageCallback(
  afterInit?: (sqliteDB: SQLiteDB) => Promise<void>,
): (event: MessageEvent<MainToWorkerMsg>) => Promise<void> {
  return async ({ data: [msg, data1, data2, data3] }: MessageEvent<MainToWorkerMsg>) => {
    const ret: WorkerToMainMsg = [msg, null, null];

    try {
      switch (msg) {
        case 0:
          await init(data1, data2, data3, afterInit);
          break;
        case 1:
          ret[1] = await exec(data1, data2, data3);
          break;
        case 2:
          await db.close();
          break;
        case 3:
          await stream((val) => postMessage([3, [val], null] satisfies WorkerToMainMsg), data1, data2);
          ret[0] = 4;
          break;
        case 4:
          loadDb((percentage) => postMessage([5, percentage, null] satisfies WorkerToMainMsg), data1, data2, data3);
          ret[0] = 6;
          break;
      }
    } catch (error) {
      console.error(error);
      ret[2] = error;
    }
    postMessage(ret);
  };
}
