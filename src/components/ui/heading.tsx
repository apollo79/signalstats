import { splitProps, type Component, type ComponentProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/utils";

type HeadingProps = ComponentProps<"h1"> & {
  level: 1 | 2 | 3 | 4 | 5 | 6;
};

const levelClassNames: { [key in HeadingProps["level"]]: string } = {
  "1": "text-3xl mb-4",
  "2": "text-2xl mb-4 mt-4",
  "3": "text-lg mb-2",
  "4": "font-bold",
  "5": "font-bold",
  "6": "font-bold",
};

export const Heading: Component<HeadingProps> = (props) => {
  const levelStyle = () => levelClassNames[props.level];

  const [local, other] = splitProps(props, ["class", "level"]);

  return (
    <Dynamic
      component={`h${local.level}`}
      class={cn("text-center font-bold", levelStyle(), local.class)}
      {...other}
    ></Dynamic>
  );
};
