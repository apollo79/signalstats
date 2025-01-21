import type { DatabaseConnection, Driver, QueryResult } from "kysely";
import { CompiledQuery, SelectQueryNode } from "kysely";
import type { Emitter } from "zen-mitt";
import { mitt } from "zen-mitt";
import type { EventWithError, MainToWorkerMsg, OfficialWasmWorkerDialectConfig, WorkerToMainMsg } from "./type";
import workerUrl from "./worker?url";

export class OfficialWasmWorkerDriver implements Driver {
  private worker?: Worker;
  private connection?: DatabaseConnection;
  private connectionMutex = new ConnectionMutex();
  private mitt?: Emitter<EventWithError>;
  constructor(private config: OfficialWasmWorkerDialectConfig) {}

  async init(): Promise<void> {
    // try to persist storage, https://web.dev/articles/persistent-storage#request_persistent_storage
    try {
      if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
        await navigator.storage.persist();
      }
      // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
    } catch {}

    this.mitt = mitt<EventWithError>();

    this.worker =
      this.config.worker ??
      new Worker(workerUrl, {
        type: "module",
      });

    this.worker.onmessage = ({ data: [type, ...msg] }: MessageEvent<WorkerToMainMsg>) => {
      this.mitt?.emit(type, ...msg);
    };

    this.worker.postMessage([0, this.config.fileName, this.config.preferOPFS ?? false] satisfies MainToWorkerMsg);

    await new Promise<void>((resolve, reject) => {
      this.mitt?.once(0, (_, err) => (err ? reject(err) : resolve()));
    });

    this.connection = new OfficialWasmWorkerConnection(this.worker, this.mitt);
    await this.config.onCreateConnection?.(this.connection);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.lock();

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return this.connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  releaseConnection(): Promise<void> {
    return new Promise((resolve) => {
      this.connectionMutex.unlock();

      resolve();
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) {
      return;
    }
    this.worker.postMessage([2] satisfies MainToWorkerMsg);
    return new Promise<void>((resolve, reject) => {
      this.mitt?.once(2, (_, err) => {
        if (err) {
          reject(err);
        } else {
          this.worker?.terminate();
          this.mitt?.off();
          this.mitt = undefined;
          resolve();
        }
      });
    });
  }
}

class ConnectionMutex {
  private promise?: Promise<void>;
  private resolve?: () => void;

  async lock(): Promise<void> {
    while (this.promise) {
      await this.promise;
    }

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.resolve;

    this.promise = undefined;
    this.resolve = undefined;

    resolve?.();
  }
}

class OfficialWasmWorkerConnection implements DatabaseConnection {
  readonly worker: Worker;
  readonly mitt?: Emitter<EventWithError>;
  constructor(worker: Worker, mitt?: Emitter<EventWithError>) {
    this.worker = worker;
    this.mitt = mitt;
  }

  async *streamQuery<R>(compiledQuery: CompiledQuery): AsyncIterableIterator<QueryResult<R>> {
    const { parameters, sql, query } = compiledQuery;
    if (!SelectQueryNode.is(query)) {
      throw new Error("official wasm worker dialect only supports SELECT queries for streaming");
    }
    this.worker.postMessage([3, sql, parameters] satisfies MainToWorkerMsg);
    let done = false;
    let resolveFn: (value: IteratorResult<QueryResult<R>>) => void;
    let rejectFn: (reason?: unknown) => void;

    this.mitt?.on(3 /* data */, (data, err): void => {
      if (err) {
        rejectFn(err);
      } else {
        resolveFn({ value: { rows: data as R[] }, done: false });
      }
    });

    this.mitt?.on(4 /* end */, (_, err): void => {
      if (err) {
        rejectFn(err);
      } else {
        resolveFn({ value: undefined, done: true });
      }
    });

    while (!done) {
      const result = await new Promise<IteratorResult<QueryResult<R>>>((res, rej) => {
        resolveFn = res;
        rejectFn = rej;
      });

      if (result.done) {
        done = true;
        this.mitt?.off(3 /* data */);
        this.mitt?.off(4 /* end */);
      } else {
        yield result.value;
      }
    }
  }

  async executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery;

    const isSelect = SelectQueryNode.is(query);

    this.worker.postMessage([1, isSelect, sql, parameters] satisfies MainToWorkerMsg);

    return new Promise((resolve, reject) => {
      if (!this.mitt) {
        reject(new Error("kysely instance has been destroyed"));
      }

      this.mitt?.once(1, (data, err) => (!err && data ? resolve(data) : reject(err)));
    });
  }
}
