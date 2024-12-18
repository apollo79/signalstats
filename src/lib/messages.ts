import { createMemo, type Accessor } from "solid-js";
import { getDateList, getHourList, getMonthList, getWeekdayList } from "./date";
import type { MessageOverview, MessageStats, Recipients } from "~/types";
import { isSameDay } from "date-fns";

export const hourNames = getHourList();

const initialHoursMap = [...hourNames.keys()];

export const monthNames = getMonthList();

const initialMonthMap = [...monthNames.keys()];

export const weekdayNames = getWeekdayList();

const initialWeekdayMap = [...weekdayNames.keys()];

export const createMessageStatsSources = (
  messageOverview: Accessor<MessageOverview>,
  recipients: Accessor<Recipients>,
) => {
  const initialRecipientMap = () => Object.fromEntries(recipients().map(({ recipientId }) => [recipientId, 0]));

  const dateList = () => {
    const currentDmMessagesOverview = messageOverview();
    const firstDate = currentDmMessagesOverview?.at(0)?.messageDate;
    const lastDate = currentDmMessagesOverview?.at(-1)?.messageDate;
    if (firstDate && lastDate) {
      return getDateList(firstDate, lastDate).map((date) => ({
        totalMessages: 0,
        date,
        ...initialRecipientMap(),
      }));
    }
  };

  return createMemo(() => {
    const currentMessageOverview = messageOverview();
    const currentDateList = dateList();
    const currentInitialRecipientMap = initialRecipientMap();

    const messageStats: MessageStats = {
      person: { ...currentInitialRecipientMap },
      month: initialMonthMap.map(() => ({ ...currentInitialRecipientMap })),
      date: currentDateList ?? [],
      weekday: initialWeekdayMap.map(() => ({ ...currentInitialRecipientMap })),
      daytime: initialHoursMap.map(() => ({ ...currentInitialRecipientMap })),
    };

    if (currentMessageOverview && currentDateList) {
      const { person, month, date, weekday, daytime } = messageStats;

      for (const message of currentMessageOverview) {
        const { messageDate } = message;

        // increment overall message count of a person
        person[message.fromRecipientId] += 1;

        // increment the message count of the message's month for this recipient
        // months are an array from 0 - 11
        month[messageDate.getMonth() - 1][message.fromRecipientId] += 1;

        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const dateStatsEntry = date.find(({ date }) => isSameDay(date, messageDate))!;

        // increment the message count of the message's date for this recipient
        dateStatsEntry[message.fromRecipientId] += 1;

        // increment the overall message count of the message's date
        dateStatsEntry.totalMessages += 1;

        const weekdayOfDate = messageDate.getDay();
        // we index starting with monday while the `Date` object indexes starting with Sunday
        const weekdayIndex = weekdayOfDate === 0 ? 6 : weekdayOfDate - 1;

        // increment the message count of the message's weekday for this recipient
        weekday[weekdayIndex][message.fromRecipientId] += 1;

        daytime[messageDate.getHours()][message.fromRecipientId] += 1;
      }
    }

    return messageStats;
  });
};
