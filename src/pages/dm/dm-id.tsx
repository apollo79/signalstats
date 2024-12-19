import { Suspense, type Component } from "solid-js";
import { createAsync, type RoutePreloadFunc, type RouteSectionProps } from "@solidjs/router";

import { dmPartnerRecipientQuery, threadMostUsedWordsQuery, threadSentMessagesOverviewQuery } from "~/db-queries";
import { getNameFromRecipient } from "~/lib/get-name-from-recipient";
import { Heading } from "~/components/ui/heading";
import { Grid } from "~/components/ui/grid";
import { Title } from "@solidjs/meta";
import { DmMessagesPerDate } from "./dm-messages-per-date";
import { DmOverview } from "./dm-overview";
import { DmWordCloud } from "./dm-wordcloud";
import { DmMessagesPerMonth } from "./dm-messages-per-month";
import { DmMessagesPerDaytime } from "./dm-messages-per-daytime";
import { DmMessagesPerRecipient } from "./dm-messages-per-recipients";
import { DmMessagesPerWeekday } from "./dm-messages-per-weekday";
import type { MessageOverview } from "~/types";
import { createMessageStatsSources } from "~/lib/messages";
import { SELF_ID } from "~/db";
import { Flex } from "~/components/ui/flex";

const getDmIdData = (dmId: number) => {
  // the other person in the chat with name and id
  const dmPartner = createAsync(async () => {
    const dmPartner = await dmPartnerRecipientQuery(dmId);

    if (dmPartner) {
      return {
        id: dmPartner._id,
        name: getNameFromRecipient(
          dmPartner.nickname_joined_name,
          dmPartner.system_joined_name,
          dmPartner.profile_joined_name,
        ),
      };
    }
  });

  const dmMessagesOverview = createAsync<MessageOverview | undefined>(async () => {
    const dmMessageOverview = await threadSentMessagesOverviewQuery(dmId);
    if (dmMessageOverview) {
      return dmMessageOverview.map((row) => {
        return {
          messageDate: new Date(row.message_datetime + "Z"),
          fromRecipientId: row.from_recipient_id,
        };
      });
    }
  });

  const mostUsedWordCounts = createAsync(async () => threadMostUsedWordsQuery(dmId, 300));

  const recipients = () => {
    const currentDmPartner = dmPartner();

    if (currentDmPartner) {
      return [
        { recipientId: currentDmPartner.id, name: currentDmPartner.name },
        {
          recipientId: SELF_ID,
          name: "You",
        },
      ];
    }
  };

  const dmMessageStats = createAsync(async () => {
    const currentDmMessagesOverview = dmMessagesOverview();
    const currentRecipients = recipients();

    if (currentDmMessagesOverview && currentRecipients) {
      return await createMessageStatsSources(dmId, currentDmMessagesOverview, currentRecipients);
    }
  });

  return {
    dmPartner,
    dmMessagesOverview,
    mostUsedWordCounts,
    recipients,
    dmMessageStats,
  };
};

export const preloadDmId: RoutePreloadFunc = (props) => {
  void getDmIdData(Number(props.params.dmid));
};

export const DmId: Component<RouteSectionProps> = (props) => {
  const { dmPartner, dmMessagesOverview, mostUsedWordCounts, recipients, dmMessageStats } = getDmIdData(
    Number(props.params.dmid),
  );

  return (
    <>
      <Title>Dm with {dmPartner()?.name}</Title>
      <div class="flex flex-col items-center">
        <Heading level={1}>DM with {dmPartner()?.name}</Heading>
        <Heading level={2}>Chat timeline</Heading>
        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">Loading...</p>
            </Flex>
          }
        >
          <DmMessagesPerDate dateStats={dmMessageStats()?.date} recipients={recipients()} />
        </Suspense>
        <DmOverview messages={dmMessagesOverview()} />
        <Heading level={2}>Messages per</Heading>

        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">Loading...</p>
            </Flex>
          }
        >
          <Grid cols={1} colsMd={2} class="gap-x-16 gap-y-16">
            <div>
              <Heading level={3}>Person</Heading>
              <DmMessagesPerRecipient personStats={dmMessageStats()?.person} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>Daytime</Heading>
              <DmMessagesPerDaytime daytimeStats={dmMessageStats()?.daytime} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>Month</Heading>
              <DmMessagesPerMonth monthStats={dmMessageStats()?.month} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>Weekday</Heading>
              <DmMessagesPerWeekday weekdayStats={dmMessageStats()?.weekday} recipients={recipients()} />
            </div>
          </Grid>
        </Suspense>
        <Heading level={2}>Word cloud</Heading>
        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">Loading...</p>
            </Flex>
          }
        >
          <DmWordCloud wordCounts={mostUsedWordCounts()} />
        </Suspense>
      </div>
    </>
  );
};

export default DmId;
