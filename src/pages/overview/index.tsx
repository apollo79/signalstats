import type { RouteSectionProps } from "@solidjs/router";
import { type Component, createResource, Show } from "solid-js";

import { allThreadsOverviewQuery, overallSentMessagesQuery, SELF_ID } from "~/db";

import { Title } from "@solidjs/meta";
import { getNameFromRecipient } from "~/lib/get-name-from-recipient";
import { OverviewTable, type RoomOverview } from "./overview-table";

export const Overview: Component<RouteSectionProps> = () => {
  const [allSelfSentMessagesCount] = createResource(() => overallSentMessagesQuery(SELF_ID));

  const [roomOverview] = createResource<RoomOverview[] | undefined>(async () => {
    const overview = await allThreadsOverviewQuery();

    return overview.map((row) => {
      const isGroup = row.title !== null;

      let name = "";

      if (row.title !== null) {
        name = row.title;
      } else {
        name = getNameFromRecipient(row.nickname_joined_name, row.system_joined_name, row.profile_joined_name);
      }

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
    <>
      <Title>Signal statistics overview</Title>

      <div>
        <p>All messages: {allSelfSentMessagesCount()?.messageCount as number}</p>
        <Show when={!roomOverview.loading && roomOverview()} fallback="Loading...">
          {(currentRoomOverview) => <OverviewTable data={currentRoomOverview()} />}
        </Show>
      </div>
    </>
  );
};

export default Overview;
