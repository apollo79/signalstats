import { type Component, createResource } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

import { dmPartnerRecipientQuery, SELF_ID, threadMostUsedWordsQuery, threadSentMessagesOverviewQuery } from "~/db";
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

export const DmId: Component<RouteSectionProps> = (props) => {
  const dmId = () => Number(props.params.dmid);

  // the other person in the chat with name and id
  const [dmPartner] = createResource(async () => {
    const dmPartner = await dmPartnerRecipientQuery(dmId());

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

  const [dmMessagesOverview] = createResource<MessageOverview>(async () => {
    const dmMessageOverview = await threadSentMessagesOverviewQuery(dmId());
    if (dmMessageOverview) {
      return dmMessageOverview.map((row) => {
        return {
          messageDate: new Date(row.message_datetime + "Z"),
          fromRecipientId: row.from_recipient_id,
        };
      });
    }
  });

  const [mostUsedWordCounts] = createResource(async () => threadMostUsedWordsQuery(dmId(), 300));

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

    return [
      {
        recipientId: SELF_ID,
        name: "You",
      },
    ];
  };

  const dmMessageStats = createMessageStatsSources(dmMessagesOverview, recipients);

  return (
    <>
      <Title>Dm with {dmPartner()?.name}</Title>
      <div class="flex flex-col items-center">
        <Heading level={1}>DM with {dmPartner()?.name}</Heading>
        <Heading level={2}>Chat timeline</Heading>
        <DmMessagesPerDate dateStats={dmMessageStats().date} recipients={recipients()} />
        <DmOverview messages={dmMessagesOverview()} />
        <Heading level={2}>Messages per</Heading>

        <Grid cols={1} colsMd={2} class="gap-x-16 gap-y-16">
          <div>
            <Heading level={3}>Person</Heading>
            <DmMessagesPerRecipient personStats={dmMessageStats().person} recipients={recipients()} />
          </div>
          <div>
            <Heading level={3}>Daytime</Heading>
            <DmMessagesPerDaytime daytimeStats={dmMessageStats().daytime} recipients={recipients()} />
          </div>
          <div>
            <Heading level={3}>Month</Heading>
            <DmMessagesPerMonth monthStats={dmMessageStats().month} recipients={recipients()} />
          </div>
          <div>
            <Heading level={3}>Weekday</Heading>
            <DmMessagesPerWeekday weekdayStats={dmMessageStats().weekday} recipients={recipients()} />
          </div>
        </Grid>
        <Heading level={2}>Word cloud</Heading>
        <DmWordCloud wordCounts={mostUsedWordCounts()} />
      </div>
    </>
  );
};

export default DmId;
