import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import * as SeparatorPrimitive from "@kobalte/core/separator";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "~/lib/utils";

type SeparatorProps<T extends ValidComponent = "hr"> = SeparatorPrimitive.SeparatorRootProps<T> & {
  class?: string | undefined;
};

const Separator = <T extends ValidComponent = "hr">(
  props: PolymorphicProps<T, SeparatorProps<T>>
) => {
  const [local, others] = splitProps(props as SeparatorProps, ["class", "orientation"]);
  return (
    <SeparatorPrimitive.Root
      orientation={local.orientation ?? "horizontal"}
      class={cn(
        "shrink-0 bg-border",
        local.orientation === "vertical" ? "h-full w-[1px]" : "h-[1px] w-full",
        local.class
      )}
      {...others}
    />
  );
};

export { Separator };
