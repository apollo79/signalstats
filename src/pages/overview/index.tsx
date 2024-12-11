import { type Component, createResource, Show } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

import { overallSentMessagesQuery, SELF_ID, threadOverviewQuery } from "~/db";

import { OverviewTable, type RoomOverview } from "./overview-table";

export const Overview: Component<RouteSectionProps> = () => {
  const [allSelfSentMessagesCount] = createResource(() => overallSentMessagesQuery(SELF_ID).executeTakeFirstOrThrow());

  const [roomOverview] = createResource<RoomOverview[]>(async () => {
    return (await threadOverviewQuery.execute()).map((row) => {
      const isGroup = row.title !== null;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const name = (
        isGroup
          ? row.title
          : /* seems possible that it is an empty string */ !row.system_joined_name
            ? row.profile_joined_name
            : row.system_joined_name
      )!;

      return {
        threadId: row.thread_id,
        recipientId: row.recipient_id,
        archived: Boolean(row.archived),
        messageCount: row.message_count,
        lastMessageDate: row.last_message_date ? new Date(row.last_message_date) : undefined,
        name,
        isGroup,
      };
    });
  });

  return (
    <div>
      <p>All messages: {allSelfSentMessagesCount()?.message_count as number}</p>
      <Show
        when={!roomOverview.loading}
        fallback="Loading..."
      >
        <OverviewTable data={roomOverview()!} />;
      </Show>
    </div>
  );
};

export default Overview;
