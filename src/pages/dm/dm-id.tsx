import { type Accessor, type Component, createResource, Show } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

import { type ChartData } from "chart.js";

import { LineChart, WordCloudChart } from "~/components/ui/charts";

import {
  dmOverviewQuery,
  dmPartnerRecipientQuery,
  dmSentMessagesPerPersonOverviewQuery,
  SELF_ID,
  threadMostUsedWordsQuery,
} from "~/db";
import { getNameFromRecipient } from "~/lib/get-name-from-recipient";
import { Heading } from "~/components/ui/heading";
import { Grid } from "~/components/ui/grid";
import { Flex } from "~/components/ui/flex";
import { CalendarArrowUp, CalendarArrowDown, CalendarClock, MessagesSquare } from "lucide-solid";
import { getDistanceBetweenDatesInDays } from "~/lib/date";

export const DmId: Component<RouteSectionProps> = (props) => {
  const dmId = () => Number(props.params.dmid);

  const [dmOverview] = createResource(async () => {
    const dmOverview = await dmOverviewQuery(dmId());

    if (dmOverview) {
      return {
        messageCount: dmOverview.message_count,
        firstMessageDate: new Date(dmOverview.first_message_date),
        lastMessageDate: new Date(dmOverview.last_message_date),
      };
    }
  });

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

  const [dmMessagesPerPerson] = createResource(() => dmSentMessagesPerPersonOverviewQuery(dmId()));

  // maps all the message counts to dates
  const dmMessages = () => {
    return dmMessagesPerPerson()?.reduce<
      {
        date: Date;
        totalMessages: number;
        [recipientId: number]: number;
      }[]
    >((prev, curr) => {
      const existingDate = prev.find(({ date }) => date === curr.message_date);

      if (existingDate) {
        existingDate[curr.from_recipient_id] = curr.message_count;

        existingDate.totalMessages += curr.message_count;
      } else {
        prev.push({
          date: curr.message_date,
          totalMessages: curr.message_count,
          [curr.from_recipient_id]: curr.message_count,
        });
      }

      return prev;
    }, []);
  };

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

  const maxWordSize = 100;

  const mostUsedWordChartData: Accessor<ChartData<"wordCloud"> | undefined> = () => {
    const currentMostUsedWordCounts = mostUsedWordCounts();

    if (currentMostUsedWordCounts) {
      // ordered descending in db query
      const highestWordCount = currentMostUsedWordCounts[0].count;

      const calcWordSizeInPixels = (count: number) => {
        return 10 + Math.round((maxWordSize / highestWordCount) * count);
      };

      return {
        labels: currentMostUsedWordCounts.map(({ word }) => word),
        datasets: [
          {
            label: "Used",
            data: currentMostUsedWordCounts.map(({ count }) => calcWordSizeInPixels(count)),
          },
        ],
      };
    }
  };

  const dateChartData: Accessor<ChartData<"line"> | undefined> = () => {
    const currentDmMessages = dmMessages();
    const currentRecipients = recipients();

    if (currentDmMessages) {
      return {
        labels: currentDmMessages.map((row) => row.date),
        datasets: [
          {
            label: "Total number of messages",
            data: currentDmMessages.map((row) => row.totalMessages),
            borderWidth: 2,
          },
          ...currentDmMessages.reduce<{ id: number; label: string; data: number[] }[]>(
            (prev, curr) => {
              for (const recipient of currentRecipients) {
                prev.find(({ id }) => id === recipient.recipientId)?.data.push(curr[recipient.recipientId] ?? 0);
              }

              return prev;
            },
            currentRecipients.map((recipient) => {
              return {
                id: recipient.recipientId,
                label: `Number of messages from ${recipient.name.toString()}`,
                data: [],
                borderWidth: 2,
              };
            }),
          ),
        ],
      };
    }
  };

  return (
    <div class="flex flex-col items-center">
      <Heading level={1}>DM with {dmPartner()?.name}</Heading>
      <Heading level={2}>Chat timeline</Heading>
      <Show when={dateChartData()}>
        {(currentDateChartData) => (
          <LineChart
            options={{
              normalized: true,
              aspectRatio: 3,
              plugins: {
                zoom: {
                  pan: {
                    enabled: true,
                    mode: "xy",
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: "xy",
                  },
                },
              },
            }}
            data={currentDateChartData()}
            class="max-h-96"
          />
        )}
      </Show>
      <Grid cols={1} colsMd={2} class="my-12 min-w-[35rem] gap-y-8 text-sm">
        <Flex flexDirection="row" justifyContent="evenly" class="bg-amber-200 p-2 text-amber-900">
          <Flex alignItems="center" justifyContent="center" class="min-w-16">
            <CalendarArrowDown />
          </Flex>
          <Flex flexDirection="col" justifyContent="around" class="flex-1">
            <span>Your first message is from</span>
            <Show when={!dmOverview.loading && dmOverview()}>
              {(currentDmOverview) => (
                <span class="font-semibold text-2xl">{currentDmOverview().firstMessageDate.toLocaleDateString()}</span>
              )}
            </Show>
          </Flex>
        </Flex>
        <Flex flexDirection="row" justifyContent="evenly" class="bg-emerald-200 p-2 text-emerald-900">
          <Flex alignItems="center" justifyContent="center" class="min-w-16">
            <CalendarArrowUp />
          </Flex>
          <Flex flexDirection="col" justifyContent="around" class="flex-1">
            <span>Your last message is from</span>
            <Show when={!dmOverview.loading && dmOverview()}>
              {(currentDmOverview) => (
                <span class="font-semibold text-2xl">{currentDmOverview().lastMessageDate.toLocaleDateString()}</span>
              )}
            </Show>
          </Flex>
        </Flex>
        <Flex flexDirection="row" justifyContent="evenly" class="bg-blue-200 p-2 text-blue-900">
          <Flex alignItems="center" justifyContent="center" class="min-w-16">
            <CalendarClock />
          </Flex>
          <Flex flexDirection="col" justifyContent="around" class="flex-1">
            <span>You have been chatting for</span>
            <Show when={!dmOverview.loading && dmOverview()}>
              {(currentDmOverview) => (
                <span class="font-semibold text-2xl">
                  {getDistanceBetweenDatesInDays(
                    currentDmOverview().firstMessageDate,
                    currentDmOverview().lastMessageDate,
                  )}
                </span>
              )}
            </Show>
            <span>days</span>
          </Flex>
        </Flex>
        <Flex flexDirection="row" justifyContent="evenly" class="bg-pink-200 p-2 text-pink-900">
          <Flex alignItems="center" justifyContent="center" class="min-w-16">
            <MessagesSquare class="h-8 w-8" />
          </Flex>
          <Flex flexDirection="col" justifyContent="around" class="flex-1">
            <span>You have written</span>
            <Show when={!dmOverview.loading && dmOverview()}>
              {(currentDmOverview) => (
                <span class="font-semibold text-2xl">{currentDmOverview().messageCount.toString()}</span>
              )}
            </Show>
            <span>messages</span>
          </Flex>
        </Flex>
      </Grid>
      <Heading level={2}>Word cloud</Heading>
      <Show when={mostUsedWordChartData()}>
        {(currentMostUsedWordChartData) => (
          // without a container this will scale in height infinitely somehow
          <div class="max-w-2xl">
            <WordCloudChart
              options={{
                normalized: true,
                aspectRatio: 3,
                plugins: {
                  tooltip: {
                    enabled: false,
                  },
                  legend: {
                    display: false,
                  },
                },
              }}
              data={currentMostUsedWordChartData()}
            />
          </div>
        )}
      </Show>
    </div>
  );
};

export default DmId;
