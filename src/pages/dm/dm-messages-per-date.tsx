import type { ChartData } from "chart.js";
import { type Accessor, type Component, Show } from "solid-js";
import { LineChart } from "~/components/ui/charts";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerDate: Component<{
  dateStats: MessageStats["date"] | undefined;
  recipients: Recipients | undefined;
}> = (props) => {
  const dateChartData: Accessor<ChartData<"line"> | undefined> = () => {
    const currentDmMessages = props.dateStats;
    const currentRecipients = props.recipients;

    if (currentDmMessages && currentRecipients) {
      const currentDmMessagesValues = Object.values(currentDmMessages);

      return {
        labels: currentDmMessages.map(({ date }) => date.toDateString()),
        datasets: [
          {
            label: "Total",
            data: currentDmMessagesValues.map((row) => row.totalMessages),
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 6,
          },
          ...currentRecipients.map((recipient) => {
            return {
              id: recipient.recipientId,
              label: recipient.name.toString(),
              data: currentDmMessagesValues.map((date) => date[recipient.recipientId]),
              borderWidth: 2,
              pointRadius: 0,
              pointHitRadius: 6,
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
            responsive: true,
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
  );
};
