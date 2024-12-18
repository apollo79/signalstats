import { Show, type Accessor, type Component } from "solid-js";
import type { ChartData } from "chart.js";
import { RadarChart } from "~/components/ui/charts";
import { weekdayNames } from "~/lib/messages";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerWeekday: Component<{
  weekdayStats: MessageStats["weekday"];
  recipients: Recipients;
}> = (props) => {
  const weekdayChartData: Accessor<ChartData<"radar"> | undefined> = () => {
    const currentMessagesPerWeekday = props.weekdayStats;
    const currentRecipients = props.recipients;

    if (currentMessagesPerWeekday && currentRecipients) {
      return {
        labels: Object.values(weekdayNames),
        datasets: [
          ...currentRecipients.map((recipient) => {
            return {
              id: recipient.recipientId,
              label: `Number of messages from ${recipient.name.toString()}`,
              data: currentMessagesPerWeekday.map((weekday) => weekday[recipient.recipientId]),
            };
          }),
        ],
      };
    }
  };

  return (
    <Show when={weekdayChartData()}>
      {(currentWeekdayChartData) => (
        <RadarChart
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
          }}
          data={currentWeekdayChartData()}
        />
      )}
    </Show>
  );
};
