import type { ChartData } from "chart.js";
import { type Accessor, type Component, Show } from "solid-js";
import { BarChart } from "~/components/ui/charts";
import { hourNames } from "~/lib/messages";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerDaytime: Component<{
  daytimeStats: MessageStats["daytime"] | undefined;
  recipients: Recipients | undefined;
}> = (props) => {
  const daytimeChartData: Accessor<ChartData<"bar"> | undefined> = () => {
    const currentMessagesPerHour = props.daytimeStats;
    const currentRecipients = props.recipients;

    if (currentMessagesPerHour && currentRecipients) {
      return {
        labels: Object.values(hourNames),
        datasets: [
          ...currentRecipients.map((recipient) => {
            return {
              id: recipient.recipientId,
              label: `Number of messages from ${recipient.name.toString()}`,
              data: currentMessagesPerHour.map((hour) => hour[recipient.recipientId]),
              borderWidth: 1,
            };
          }),
        ],
      };
    }
  };

  return (
    <Show when={daytimeChartData()}>
      {(currentDaytimeChartData) => (
        <BarChart
          options={{
            normalized: true,
            plugins: {
              legend: {
                display: false,
              },
              deferred: {
                yOffset: "50%",
              },
            },
            aspectRatio: 2,
          }}
          data={currentDaytimeChartData()}
        />
      )}
    </Show>
  );
};
