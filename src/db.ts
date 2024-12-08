import initSqlJS, { type Database } from "sql.js";

import wasmURL from "./assets/sql-wasm.wasm?url";
import dbURL from "./assets/database.sqlite?url";
import { createMemo, createSignal } from "solid-js";

export const SELF_ID = 2;

export const SQL = await initSqlJS({
  locateFile: () => wasmURL,
});

const file = await fetch(dbURL).then((res) => res.arrayBuffer());

const testDb = new SQL.Database(new Uint8Array(file));

export const [db, setDb] = createSignal<Database>(testDb);

const createStatement = (sql: string) => {
  return createMemo(() => {
    return db().prepare(sql);
  });
};

export const roomOverviewStmt = createStatement(`
SELECT
  thread.recipient_id,
  thread.active,
  thread.archived,
  recipient.profile_joined_name,
  recipient.system_joined_name,
  groups.title,
  message_count,
  last_message_date
FROM
  thread
  LEFT JOIN (
    SELECT
      thread_id,
      COUNT(*) AS message_count
    FROM
      message
    WHERE
      message.body IS NOT NULL
      AND message.body != ''
    GROUP BY
      thread_id
  ) message_counts ON message_counts.thread_id = thread._id
  LEFT JOIN (
    SELECT
      thread_id,
      max(date_sent) AS last_message_date
    FROM
      message
    GROUP BY
      thread_id
  ) last_messages ON last_messages.thread_id = thread._id
  JOIN recipient ON thread.recipient_id = recipient._id
  LEFT JOIN groups ON recipient._id = groups.recipient_id
WHERE
  message_count > 0
`);

export type RoomOverviewColumn = {
  recipient_id: number;
  active: 0 | 1;
  archived: 0 | 1;
  message_count: number;
  last_message_date: number;
} & (
  | {
      profile_joined_name: string;
      system_joined_name: string | null;
      title: null;
    }
  | {
      profile_joined_name: null;
      system_joined_name: null;
      title: string;
    }
);

export const overallSentMessagesStmt = createStatement(`
  SELECT 
    COUNT(*) as message_count
  FROM
    message
  WHERE (message.from_recipient_id = :recipient_id AND message.body IS NOT NULL AND message.body != '')
`);
