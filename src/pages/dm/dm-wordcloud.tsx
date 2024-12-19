import type { ChartData } from "chart.js";
import { Show, type Accessor, type Component } from "solid-js";
import { WordCloudChart } from "~/components/ui/charts";
import type { threadMostUsedWordsQuery } from "~/db-queries";

const maxWordSize = 100;

export const DmWordCloud: Component<{
  wordCounts: Awaited<ReturnType<typeof threadMostUsedWordsQuery>> | undefined;
}> = (props) => {
  const mostUsedWordChartData: Accessor<ChartData<"wordCloud"> | undefined> = () => {
    const currentMostUsedWordCounts = props.wordCounts;

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

  return (
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
  );
};
