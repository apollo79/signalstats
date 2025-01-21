import sqlite3InitModule, {
  type BindingSpec,
  type Database,
  type OpfsDatabase,
  type Sqlite3Static,
  type SqlValue,
} from "@sqlite.org/sqlite-wasm";
import type { QueryResult } from "kysely";
import type { MainToWorkerMsg, WorkerToMainMsg } from "../type";

let sqlite3: Sqlite3Static;
let currentDbName: string;
let db: Database | OpfsDatabase;

async function init(
  fileName: string,
  preferOpfs: boolean,
  afterInit?: (sqliteDB: Database | OpfsDatabase) => Promise<void>,
): Promise<void> {
  if (db && currentDbName === fileName) {
    return;
  }

  // only open new Db if there is no db opened or we want to open a different db
  currentDbName = fileName;

  sqlite3 = await sqlite3InitModule();

  db = preferOpfs && "opfs" in sqlite3.oo1 ? new sqlite3.oo1.OpfsDb(fileName) : new sqlite3.oo1.DB(fileName);

  await afterInit?.(db);
}

function exec(
  isSelect: boolean,
  sql: string,
  parameters?: readonly unknown[],
): QueryResult<{
  [columnName: string]: SqlValue;
}> {
  if (isSelect) {
    const rows = db.selectObjects(sql, parameters as BindingSpec);

    return { rows };
  } else {
    db.exec(sql, {
      bind: parameters as BindingSpec,
      returnValue: "resultRows",
    });

    return {
      rows: [],
      insertId: BigInt(sqlite3.capi.sqlite3_last_insert_rowid(db)),
      numAffectedRows: BigInt(db.changes()),
    };
  }
}

function stream(
  onData: (data: { [columnName: string]: SqlValue }) => void,
  sql: string,
  parameters?: readonly unknown[],
): void {
  const stmt = db.prepare(sql);

  if (parameters) {
    stmt.bind(parameters as BindingSpec);
  }

  while (stmt.step()) {
    onData(stmt.get({}));
  }

  stmt.finalize();
}

async function loadDb(onData: (percentage: number) => void, fileName: string, useOPFS: boolean, statements: string[]) {
  if (!db) {
    await init(fileName, useOPFS);
  }

  const length = statements.length;
  let percentage = 0;

  for (let i = 0; i < length; i++) {
    const newPercentage = Math.round((i / length) * 100);

    if (newPercentage !== percentage) {
      onData(newPercentage);

      percentage = newPercentage;
    }

    db.exec(statements[i]);
  }
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
  afterInit?: (sqliteDB: Database | OpfsDatabase) => Promise<void>,
): (event: MessageEvent<MainToWorkerMsg>) => Promise<void> {
  return async ({ data: [msg, data1, data2, data3] }: MessageEvent<MainToWorkerMsg>) => {
    const ret: WorkerToMainMsg = [msg, null, null];

    try {
      switch (msg) {
        case 0:
          await init(data1, data2, afterInit);
          break;
        case 1:
          ret[1] = exec(data1, data2, data3);
          break;
        case 2:
          db.close();
          break;
        case 3:
          stream((val) => postMessage([3, [val], null] satisfies WorkerToMainMsg), data1, data2);
          ret[0] = 4;
          break;
        case 4:
          await loadDb(
            (percentage) => postMessage([5, percentage, null] satisfies WorkerToMainMsg),
            data1,
            data2,
            data3,
          );
          ret[0] = 6;
          break;
      }
    } catch (error) {
      ret[2] = error;
    }

    postMessage(ret);
  };
}
