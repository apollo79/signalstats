// https://stackoverflow.com/a/15289883
export const getDistanceBetweenDatesInDays = (a: Date, b: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

// https://dev.to/pretaporter/how-to-get-month-list-in-your-language-4lfb
export const getMonthList = (
  locales?: string | string[],
  format: "long" | "short" = "long"
): string[] => {
  const year = new Date().getFullYear(); // 2020
  const monthList = [...Array(12).keys()]; // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const formatter = new Intl.DateTimeFormat(locales, {
    month: format,
  });

  const getMonthName = (monthIndex: number) =>
    formatter.format(new Date(year, monthIndex));

  return monthList.map(getMonthName);
};

export const getDateList = (startDate: Date, endDate: Date): Date[] => {
  const dateArray = new Array();

  // end date for loop has to be one date after because we increment after adding the date in the loop
  const endDateForLoop = new Date(endDate);

  endDateForLoop.setDate(endDateForLoop.getDate() + 1);

  let currentDate = startDate;

  while (currentDate <= endDateForLoop) {
    dateArray.push(new Date(currentDate));

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);

    currentDate = newDate;
  }

  return dateArray;
};

export const getHourList = (
  locales?: string | string[],
  format: "numeric" | "2-digit" = "numeric"
): string[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const hourList = [...Array(24).keys()]; // [0, 1, 2, 3, 4, 5, 6, ..., 23]
  const formatter = new Intl.DateTimeFormat(locales, {
    hour: format,
    hourCycle: "h11",
  });

  const getHourName = (hourIndex: number) =>
    formatter.format(new Date(year, month, day, hourIndex));

  return hourList.map(getHourName);
};

export const getWeekdayList = (
  locales?: string | string[],
  format: "long" | "short" | "narrow" = "long"
): string[] => {
  const monday = new Date();
  // set day to monday (w/o +1 it would be sunday)
  monday.setDate(monday.getDate() - monday.getDay() + 1);

  const year = monday.getFullYear();
  const month = monday.getMonth();
  const mondayDate = monday.getDate();

  const hourList = [...Array(7).keys()]; // [0, 1, 2, 3, 4, 5, 6]
  const formatter = new Intl.DateTimeFormat(locales, {
    weekday: format,
  });

  const getWeekDayName = (weekDayIndex: number) =>
    formatter.format(new Date(year, month, mondayDate + weekDayIndex));

  return hourList.map(getWeekDayName);
};
