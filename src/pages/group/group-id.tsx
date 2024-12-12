import type { Component } from "solid-js";
import type { RouteSectionProps } from "@solidjs/router";

export const GroupId: Component<RouteSectionProps> = (props) => {
  const groupId = () => Number(props.params.groupid);
};

export default GroupId;
