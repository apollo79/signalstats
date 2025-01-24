import type { MessageOverview, MessageStats, Recipients } from "~/types";
import { getHourList, getMonthList, getWeekdayList } from "./date";
import { cached } from "./db-cache";
import MessageStatsWorker from "./messages-worker?worker";

export const hourNames = getHourList();

export const monthNames = getMonthList();

export const weekdayNames = getWeekdayList();

const messageStatsWorker = new MessageStatsWorker();

export const createMessageStatsSources = cached(
  (dmId: number, messageOverview: MessageOverview, recipients: Recipients) => {
    messageStatsWorker.postMessage({
      dmId,
      messageOverview,
      recipients,
    });

    return new Promise<MessageStats>((resolve) => {
      const listener = (
        event: MessageEvent<{
          dmId: number;
          messageStatsSources: MessageStats;
        }>,
      ) => {
        if (event.data.dmId === dmId) {
          resolve(event.data.messageStatsSources);
        }
      };

      messageStatsWorker.addEventListener("message", listener);
    });
  },
);
