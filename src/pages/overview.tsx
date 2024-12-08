import type { RouteSectionProps } from "@solidjs/router";
import type { Component } from "solid-js";
import { overallSentMessagesStmt, roomOverviewStmt, SELF_ID, type RoomOverviewColumn } from "~/db";

type RoomOverview = {
  recipientId: number;
  active: boolean;
  archived: boolean;
  messageCount: number;
  lastMessageDate: number;
  title: string;
  isGroup: boolean;
}[];

export const Overview: Component<RouteSectionProps> = () => {
  const allSelfSentMessagesCount = overallSentMessagesStmt().getAsObject({
    ":recipient_id": SELF_ID,
  });

  const roomOverviewRaw: RoomOverviewColumn[] = [];

  while (roomOverviewStmt().step()) {
    roomOverviewRaw.push(roomOverviewStmt().getAsObject() as RoomOverviewColumn);
  }

  roomOverviewStmt().free();

  const roomOverview: RoomOverview = roomOverviewRaw.map((column) => {
    const isGroup = Boolean(column.title);

    return {
      recipientId: column.recipient_id,
      active: Boolean(column.active),
      archived: Boolean(column.archived),
      messageCount: column.message_count,
      lastMessageDate: column.last_message_date,
      title: isGroup ? column.title! : (column.system_joined_name ?? column.profile_joined_name)!,
      isGroup,
    };
  });

  console.log(roomOverview);

  return <p>All messages: {allSelfSentMessagesCount.message_count as number}</p>;
};

export default Overview;
