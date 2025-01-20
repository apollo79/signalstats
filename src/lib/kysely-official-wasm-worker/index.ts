import type {
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  Kysely,
  QueryCompiler,
} from "kysely";
import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { OfficialWasmWorkerDriver } from "./driver";
import type { OfficialWasmWorkerDialectConfig } from "./type";

export type {
  Promisable,
  OfficialWasmWorkerDialectConfig as WaSqliteWorkerDialectConfig,
} from "./type";
export { createOnMessageCallback } from "./worker/utils";

export class OfficialWasmWorkerDialect implements Dialect {
  constructor(private config: OfficialWasmWorkerDialectConfig) {}

  createDriver(): Driver {
    return new OfficialWasmWorkerDriver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
