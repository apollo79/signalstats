import { Title } from "@solidjs/meta";
import { type RoutePreloadFunc, type RouteSectionProps, createAsync } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import { Flex } from "~/components/ui/flex";
import { Grid } from "~/components/ui/grid";
import { Heading } from "~/components/ui/heading";
import { SELF_ID, dmPartnerRecipientQuery, threadMostUsedWordsQuery, threadSentMessagesOverviewQuery } from "~/db";
import { getNameFromRecipient } from "~/lib/get-name-from-recipient";
import { createMessageStatsSources } from "~/lib/messages";
import * as m from "~/paraglide/messages";
import type { MessageOverview } from "~/types";
import { DmMessagesPerDate } from "./dm-messages-per-date";
import { DmMessagesPerDaytime } from "./dm-messages-per-daytime";
import { DmMessagesPerMonth } from "./dm-messages-per-month";
import { DmMessagesPerRecipient } from "./dm-messages-per-recipients";
import { DmMessagesPerWeekday } from "./dm-messages-per-weekday";
import { DmOverview } from "./dm-overview";
import { DmWordCloud } from "./dm-wordcloud";

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
      <Title>
        {m.petty_best_bobcat_affirm()} {dmPartner()?.name}
      </Title>
      <div class="flex flex-col items-center">
        <Heading level={1}>
          {m.petty_best_bobcat_affirm()} {dmPartner()?.name}
        </Heading>
        <Heading level={2}>{m.legal_inclusive_lionfish_zap()}</Heading>
        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">{m.mealy_wacky_toucan_spark()}</p>
            </Flex>
          }
        >
          <DmMessagesPerDate dateStats={dmMessageStats()?.date} recipients={recipients()} />
        </Suspense>
        <DmOverview messages={dmMessagesOverview()} />
        <Heading level={2}>{m.fresh_grand_millipede_twirl()}</Heading>

        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">{m.mealy_wacky_toucan_spark()}</p>
            </Flex>
          }
        >
          <Grid cols={1} colsMd={2} class="gap-x-16 gap-y-16">
            <div>
              <Heading level={3}>{m.top_brief_sparrow_boost()}</Heading>
              <DmMessagesPerRecipient personStats={dmMessageStats()?.person} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>{m.cool_cozy_dingo_mop()}</Heading>
              <DmMessagesPerDaytime daytimeStats={dmMessageStats()?.daytime} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>{m.funny_wise_mink_boil()}</Heading>
              <DmMessagesPerMonth monthStats={dmMessageStats()?.month} recipients={recipients()} />
            </div>
            <div>
              <Heading level={3}>{m.wise_house_bobcat_boil()}</Heading>
              <DmMessagesPerWeekday weekdayStats={dmMessageStats()?.weekday} recipients={recipients()} />
            </div>
          </Grid>
        </Suspense>
        <Heading level={2}>{m.north_green_goat_arise()}</Heading>
        <Suspense
          fallback={
            <Flex alignItems="center" justifyContent="center" class="h-64">
              <p class="text-4xl">{m.mealy_wacky_toucan_spark()}</p>
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
