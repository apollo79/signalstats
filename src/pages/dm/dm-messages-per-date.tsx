import { createEffect, Show, type Accessor, type Component } from "solid-js";
import type { ChartData } from "chart.js";
import { LineChart } from "~/components/ui/charts";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerDate: Component<{
  dateStats: MessageStats["date"];
  recipients: Recipients;
}> = (props) => {
  const dateChartData: Accessor<ChartData<"line"> | undefined> = () => {
    const currentDmMessages = props.dateStats;
    const currentRecipients = props.recipients;

    if (currentDmMessages) {
      const currentDmMessagesValues = Object.values(currentDmMessages);

      return {
        labels: currentDmMessages.map(({ date }) => date.toDateString()),
        datasets: [
          {
            label: "Total",
            data: currentDmMessagesValues.map((row) => row.totalMessages),
            borderWidth: 2,
          },
          ...currentRecipients.map((recipient) => {
            return {
              id: recipient.recipientId,
              label: recipient.name.toString(),
              data: currentDmMessagesValues.map((date) => date[recipient.recipientId]),
              borderWidth: 2,
            };
          }),
        ],
      };
    }
  };

  return (
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
        />
      )}
    </Show>
  );
};
