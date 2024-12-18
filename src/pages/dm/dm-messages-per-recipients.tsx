import { Show, type Accessor, type Component } from "solid-js";
import type { ChartData } from "chart.js";
import { PieChart } from "~/components/ui/charts";
import type { MessageStats, Recipients } from "~/types";

export const DmMessagesPerRecipient: Component<{
  personStats: MessageStats["person"];
  recipients: Recipients;
}> = (props) => {
  const recipientChartData: Accessor<ChartData<"pie"> | undefined> = () => {
    const currentMessagesPerRecipient = props.personStats;
    const currentRecipients = props.recipients;

    if (currentMessagesPerRecipient && currentRecipients) {
      return {
        labels: Object.keys(currentMessagesPerRecipient).map(
          (id) => currentRecipients.find(({ recipientId }) => recipientId === Number(id))?.name,
        ),
        datasets: [
          {
            label: "Number of messages",
            data: Object.values(currentMessagesPerRecipient),
          },
        ],
      };
    }
  };

  return (
    <Show when={recipientChartData()}>
      {(currentRecipientChartData) => (
        <PieChart
          options={{
            normalized: true,
            plugins: {
              deferred: {
                yOffset: "50%",
              },
            },
          }}
          data={currentRecipientChartData()}
          class="max-h-96"
        />
      )}
    </Show>
  );
};
