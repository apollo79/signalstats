import { type Accessor, createMemo, createSignal, DEV, type Setter } from "solid-js";

import { Kysely, type NotNull } from "kysely";
import type { DB } from "kysely-codegen";
import { SqlJsDialect } from "kysely-wasm";
import initSqlJS, { type Database } from "sql.js";

import wasmURL from "./assets/sql-wasm.wasm?url";

export const SELF_ID = 2;

export const SQL = await initSqlJS({
  locateFile: () => wasmURL,
});

let rawDb: Accessor<Database | undefined>, setRawDb: Setter<Database | undefined>;

if (DEV) {
  const file = await import("./assets/database.sqlite?url").then((result) => {
    return fetch(result.default).then((res) => res.arrayBuffer());
  });

  const testDb = new SQL.Database(new Uint8Array(file));

  [rawDb, setRawDb] = createSignal<Database>(testDb);
} else {
  [rawDb, setRawDb] = createSignal<Database>();
}

export { rawDb as db, setRawDb as setDb };

const sqlJsDialect = () => {
  const currentDb = rawDb();

  if (currentDb) {
    return new SqlJsDialect({
      database: currentDb,
    });
  }
};

const kyselyDb = createMemo(() => {
  const currentSqlJsDialect = sqlJsDialect();

  if (!currentSqlJsDialect) {
    throw new Error("no db selected!");
  }

  return new Kysely<DB>({
    dialect: currentSqlJsDialect,
  });
});

export const threadOverviewQuery = kyselyDb()
  .selectFrom("thread")
  .innerJoin(
    (eb) =>
      eb
        .selectFrom("message")
        .select(["thread_id", kyselyDb().fn.countAll().as("message_count")])
        .where((eb) => {
          return eb.and([eb("message.body", "is not", null), eb("message.body", "is not", "")]);
        })
        .groupBy("message.thread_id")
        .as("message"),
    (join) => join.onRef("message.thread_id", "=", "thread._id"),
  )
  .innerJoin("recipient", "thread.recipient_id", "recipient._id")
  .leftJoin("groups", "recipient._id", "groups.recipient_id")
  .select([
    "thread._id as thread_id",
    "thread.recipient_id",
    "thread.archived",
    "recipient.profile_joined_name",
    "recipient.system_joined_name",
    "groups.title",
    "message_count",
    "thread.date as last_message_date",
  ])
  .where("message_count", ">", 0)
  .$narrowType<{
    thread_id: NotNull;
    archived: NotNull;
    message_count: number;
  }>();

console.log(threadOverviewQuery.compile());

export const overallSentMessagesQuery = (recipientId: number) =>
  kyselyDb()
    .selectFrom("message")
    .select(kyselyDb().fn.countAll().as("message_count"))
    .where((eb) =>
      eb.and([
        eb("message.from_recipient_id", "=", recipientId),
        eb("message.body", "is not", null),
        eb("message.body", "!=", ""),
      ]),
    );
