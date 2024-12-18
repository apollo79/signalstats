export type MessageOverview = {
  messageDate: Date;
  fromRecipientId: number;
}[];

export type Recipients = {
  recipientId: number;
  name: string;
}[];

export type MessageStats = {
  // indexed by recipientId
  person: {
    [recipientId: number]: number;
  };
  // month from 0 to 11 = from January to December, each month indexed by recipientId
  month: {
    [recipientId: number]: number;
  }[];
  // every date of the chat history, indexed by the date string
  date: {
    [recipientId: number]: number;
    date: Date;
    totalMessages: number;
  }[];
  // weekdays from 0 to 6 = from Monday to Sunday (not from Sunday to Saturday as in the `Date` object), each weekday indexed by recipientId
  weekday: {
    [recipientId: number]: number;
  }[];
  // hours of the day from 0 - 23, each hour indexed by recipientId
  daytime: {
    [recipientId: number]: number;
  }[];
};
