import type { SqlValue } from "@sqlite.org/sqlite-wasm";
import type { DatabaseConnection, QueryResult } from "kysely";

export type Promisable<T> = T | Promise<T>;

export interface OfficialWasmWorkerDialectConfig {
  /**
   * db file name
   */
  fileName: string;
  /**
   * prefer to store data in OPFS
   * @default true
   */
  preferOPFS?: boolean;
  /**
   * official wasm worker
   */
  worker?: Worker;
  onCreateConnection?: (connection: DatabaseConnection) => Promisable<void>;
}

type InitMsg = [type: 0, fileName: string, useOPFS: boolean];

type RunMsg = [type: 1, isSelect: boolean, sql: string, parameters?: readonly unknown[]];

type CloseMsg = [2];

type StreamMsg = [type: 3, sql: string, parameters?: readonly unknown[]];

type LoadDbMsg = [type: 4, filename: string, useOPFS: boolean, statements: string[]];

export type MainToWorkerMsg = InitMsg | RunMsg | CloseMsg | StreamMsg | LoadDbMsg;

type Events = {
  0: null;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  1: QueryResult<any> | null;
  2: null;
  3: {
    [columnName: string]: SqlValue;
  }[];
  4: null;
  5: number;
  6: null;
};

export type WorkerToMainMsg = {
  [K in keyof Events]: [type: K, data: Events[K], err: unknown];
}[keyof Events];

export type EventWithError = {
  [K in keyof Events]: [data: Events[K], err: unknown];
};
