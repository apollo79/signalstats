import type { Component } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

export const Chat: Component<RouteSectionProps> = (props) => {
  const threadId = () => props.params.threadid;

  return threadId();
};
