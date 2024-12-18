import { Show, type Accessor, type Component } from "solid-js";
import type { ChartData } from "chart.js";
import { RadarChart } from "~/components/ui/charts";
import { monthNames } from "~/lib/messages";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerMonth: Component<{
  monthStats: MessageStats["month"];
  recipients: Recipients;
}> = (props) => {
  const monthChartData: Accessor<ChartData<"radar"> | undefined> = () => {
    const currentMessagesPerMonth = props.monthStats;
    const currentRecipients = props.recipients;

    if (currentMessagesPerMonth && currentRecipients) {
      return {
        labels: Object.values(monthNames),
        datasets: [
          ...currentRecipients.map((recipient) => {
            return {
              id: recipient.recipientId,
              label: `Number of messages from ${recipient.name.toString()}`,
              data: currentMessagesPerMonth.map((month) => month[recipient.recipientId]),
            };
          }),
        ],
      };
    }
  };

  return (
    <Show when={monthChartData()}>
      {(currentMonthChartData) => (
        <RadarChart
          title="Month"
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
          data={currentMonthChartData()}
          class="max-h-96"
        />
      )}
    </Show>
  );
};
