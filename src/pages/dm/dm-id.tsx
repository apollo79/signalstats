import { type Accessor, type Component, createResource, Show } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

import { type ChartData } from "chart.js";

import { LineChart } from "~/components/ui/charts";

import { dmPartnerRecipientQuery, dmSentMessagesPerPersonOverviewQuery, SELF_ID } from "~/db";

export const DmId: Component<RouteSectionProps> = (props) => {
  const dmId = () => Number(props.params.dmid);

  const [dmPartner] = createResource(async () => {
    const dmPartner = await dmPartnerRecipientQuery(dmId());

    if (dmPartner) {
      return {
        id: dmPartner._id,
        name: /* can be empty string */ !dmPartner.system_joined_name
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            dmPartner.profile_joined_name!
          : dmPartner.system_joined_name,
      };
    }
  });

  const [dmMessagesPerPerson] = createResource(() => dmSentMessagesPerPersonOverviewQuery(dmId()));

  const dmMessages = () => {
    return dmMessagesPerPerson()?.reduce<
      {
        date: Date;
        totalMessages: number;
        [key: number]: number;
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
    <Show when={dateChartData()}>
      {(currentDateChartData) => (
        <div class="max-h-96">
          <LineChart
            options={{
              normalized: true,
              aspectRatio: 2,
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
          />
        </div>
      )}
    </Show>
  );
};

export default DmId;
