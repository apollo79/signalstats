import { CalendarArrowDown, CalendarArrowUp, CalendarClock, MessagesSquare } from "lucide-solid";
import { type Component, Show } from "solid-js";
import { Flex } from "~/components/ui/flex";
import { Grid } from "~/components/ui/grid";
import { getDistanceBetweenDatesInDays } from "~/lib/date";
import * as m from "~/paraglide/messages";
import type { MessageOverview } from "~/types";

export const DmOverview: Component<{
  messages: MessageOverview | undefined;
}> = (props) => {
  const dmOverview = () => {
    const firstMessageDate = props.messages?.at(0)?.messageDate;
    const lastMessageDate = props.messages?.at(-1)?.messageDate;
    const messageCount = props.messages?.length;

    if (firstMessageDate && lastMessageDate && messageCount) {
      return {
        firstMessageDate,
        lastMessageDate,
        messageCount,
      };
    }
  };

  return (
    <Grid cols={1} colsMd={2} class="my-12 w-full gap-y-8 text-sm md:min-w-[35rem]">
      <Flex flexDirection="row" justifyContent="evenly" class="bg-amber-200 p-2 text-amber-900">
        <Flex alignItems="center" justifyContent="center" class="min-w-16">
          <CalendarArrowDown class="h-8 w-8" />
        </Flex>
        <Flex flexDirection="col" justifyContent="around" class="flex-1">
          <span>{m.knotty_wild_rat_aim()}</span>
          <Show when={dmOverview()}>
            {(currentDmOverview) => (
              <span class="font-semibold text-2xl">{currentDmOverview().firstMessageDate.toDateString()}</span>
            )}
          </Show>
        </Flex>
      </Flex>
      <Flex flexDirection="row" justifyContent="evenly" class="bg-emerald-200 p-2 text-emerald-900">
        <Flex alignItems="center" justifyContent="center" class="min-w-16">
          <CalendarArrowUp class="h-8 w-8" />
        </Flex>
        <Flex flexDirection="col" justifyContent="around" class="flex-1">
          <span>{m.bald_helpful_millipede_intend()}</span>
          <Show when={dmOverview()}>
            {(currentDmOverview) => (
              <span class="font-semibold text-2xl">{currentDmOverview().lastMessageDate.toDateString()}</span>
            )}
          </Show>
        </Flex>
      </Flex>
      <Flex flexDirection="row" justifyContent="evenly" class="bg-blue-200 p-2 text-blue-900">
        <Flex alignItems="center" justifyContent="center" class="min-w-16">
          <CalendarClock class="h-8 w-8" />
        </Flex>
        <Flex flexDirection="col" justifyContent="around" class="flex-1">
          <span>{m.trite_civil_niklas_laugh()}</span>
          <Show when={dmOverview()}>
            {(currentDmOverview) => (
              <span class="font-semibold text-2xl">
                {getDistanceBetweenDatesInDays(
                  currentDmOverview().firstMessageDate,
                  currentDmOverview().lastMessageDate,
                )}
              </span>
            )}
          </Show>
          <span>{m.careful_real_deer_buzz()}</span>
        </Flex>
      </Flex>
      <Flex flexDirection="row" justifyContent="evenly" class="bg-pink-200 p-2 text-pink-900">
        <Flex alignItems="center" justifyContent="center" class="min-w-16">
          <MessagesSquare class="h-8 w-8" />
        </Flex>
        <Flex flexDirection="col" justifyContent="around" class="flex-1">
          <span>{m.due_gaudy_lark_grip()}</span>
          <Show when={dmOverview()}>
            {(currentDmOverview) => (
              <span class="font-semibold text-2xl">{currentDmOverview().messageCount.toString()}</span>
            )}
          </Show>
          <span>{m.weary_noble_ostrich_cry()}</span>
        </Flex>
      </Flex>
    </Grid>
  );
};
