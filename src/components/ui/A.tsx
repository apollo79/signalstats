import { splitProps, type Component } from "solid-js";
import { type AnchorProps, A as BaseA } from "@solidjs/router";
import clsx from "clsx";

export const A: Component<AnchorProps> = (props) => {
  const [local, other] = splitProps(props, ["class"]);
  return <BaseA class={clsx("text-primary", local.class)} {...other} />;
};
