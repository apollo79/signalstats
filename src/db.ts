import { type Accessor, createEffect, createMemo, createRoot, createSignal, DEV, type Setter } from "solid-js";

import { Kysely, type NotNull, sql } from "kysely";
import type { DB } from "kysely-codegen";
import { SqlJsDialect } from "kysely-wasm";
import initSqlJS, { type Database } from "sql.js";

import wasmURL from "./assets/sql-wasm.wasm?url";
import { cached } from "./lib/db-cache";

export const SELF_ID = 2;

export const SQL = await initSqlJS({
  locateFile: () => wasmURL,
});

let rawDb: Accessor<Database | undefined> = () => undefined,
  setRawDb: Setter<Database | undefined> = () => undefined;

if (DEV) {
  const file = await import("./assets/database.sqlite?url").then((result) => {
    return fetch(result.default).then((res) => res.arrayBuffer());
  });

  const testDb = new SQL.Database(new Uint8Array(file));

  [rawDb, setRawDb] = createSignal<Database | undefined>(testDb);
} else {
  [rawDb, setRawDb] = createSignal<Database | undefined>();
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

const kyselyDb = createRoot(() => {
  createEffect(() => {
    const db = rawDb();

    if (db) {
      db.create_function("is_not_empty", (str: string | null) => {
        return str !== null && str !== "";
      });
    }
  });

  return createMemo(() => {
    const currentSqlJsDialect = sqlJsDialect();

    if (!currentSqlJsDialect) {
      throw new Error("no db selected!");
    }

    return new Kysely<DB>({
      dialect: currentSqlJsDialect,
    });
  });
});

const allThreadsOverviewQueryRaw = kyselyDb()
  .selectFrom("thread")
  .innerJoin(
    (eb) =>
      eb
        .selectFrom("message")
        .select((eb) => ["message.thread_id", eb.fn.countAll().as("message_count")])
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
  }>()
  .compile();

export const allThreadsOverviewQuery = cached(() => kyselyDb().executeQuery(allThreadsOverviewQueryRaw));

const overallSentMessagesQueryRaw = (recipientId: number) =>
  kyselyDb()
    .selectFrom("message")
    .select((eb) => eb.fn.countAll().as("messageCount"))
    .where((eb) =>
      eb.and([
        eb("message.from_recipient_id", "=", recipientId),
        eb("message.body", "is not", null),
        eb("message.body", "!=", ""),
      ]),
    )
    .executeTakeFirst();

export const overallSentMessagesQuery = cached(overallSentMessagesQueryRaw);

const dmPartnerRecipientQueryRaw = (dmId: number) =>
  kyselyDb()
    .selectFrom("recipient")
    .select(["recipient._id", "recipient.system_joined_name", "recipient.profile_joined_name"])
    .innerJoin("thread", "recipient._id", "thread.recipient_id")
    .where((eb) => eb.and([eb("thread._id", "=", dmId), eb("recipient._id", "!=", SELF_ID)]))
    .$narrowType<{
      _id: number;
    }>()
    .executeTakeFirst();

export const dmPartnerRecipientQuery = cached(dmPartnerRecipientQueryRaw);

const dmOverviewQueryRaw = (dmId: number) =>
  kyselyDb()
    .selectFrom("message")
    .select((eb) => [
      sql<Date>`DATE(datetime(message.date_sent / 1000, 'unixepoch'))`.as("message_date"),
      eb.fn.countAll().as("message_count"),
    ])
    .groupBy("message_date")
    .orderBy("message_date asc")
    .where("thread_id", "=", dmId)
    .execute();

export const dmOverviewQuery = cached(dmOverviewQueryRaw);

const threadSentMessagesPerPersonOverviewQueryRaw = (threadId: number) =>
  kyselyDb()
    .selectFrom("message")
    .select((eb) => [
      "from_recipient_id",
      sql<Date>`DATE(datetime(message.date_sent / 1000, 'unixepoch'))`.as("message_date"),
      eb.fn.countAll().as("message_count"),
    ])
    .groupBy(["from_recipient_id", "message_date"])
    .orderBy(["message_date"])
    .where((eb) => eb.and([eb("body", "is not", null), eb("body", "!=", ""), eb("thread_id", "=", threadId)]))
    .$narrowType<{
      message_count: number;
    }>()
    .execute();

export const dmSentMessagesPerPersonOverviewQuery = cached(threadSentMessagesPerPersonOverviewQueryRaw);

const threadMostUsedWordsQueryRaw = (threadId: number, limit = 10) =>
  kyselyDb()
    .withRecursive("words", (eb) => {
      return eb
        .selectFrom("message")
        .select([
          sql`LOWER(substr(body, 1, instr(body || " ", " ") - 1))`.as("word"),
          sql`(substr(body, instr(body || " ", " ") + 1))`.as("rest"),
        ])
        .where((eb) => eb.and([eb("body", "is not", null), eb("thread_id", "=", threadId)]))
        .unionAll((ebInner) => {
          return ebInner
            .selectFrom("words")
            .select([
              sql`LOWER(substr(rest, 1, instr(rest || " ", " ") - 1))`.as("word"),
              sql`(substr(rest, instr(rest || " ", " ") + 1))`.as("rest"),
            ])
            .where("rest", "<>", "");
        });
    })
    .selectFrom("words")
    .select((eb) => ["word", eb.fn.countAll().as("count")])
    .where("word", "<>", "")
    .groupBy("word")
    .orderBy("count desc")
    .limit(limit)
    .$narrowType<{
      count: number;
    }>()
    .execute();

export const threadMostUsedWordsQuery = cached(threadMostUsedWordsQueryRaw);
