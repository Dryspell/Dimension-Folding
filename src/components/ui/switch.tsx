import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import * as SwitchPrimitive from "@kobalte/core/switch";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "~/lib/utils";

const SwitchLabel = SwitchPrimitive.Label;
const SwitchErrorMessage = SwitchPrimitive.ErrorMessage;
const SwitchDescription = SwitchPrimitive.Description;

type SwitchProps<T extends ValidComponent = "div"> = SwitchPrimitive.SwitchRootProps<T> & {
  class?: string | undefined;
};

const Switch = <T extends ValidComponent = "div">(props: PolymorphicProps<T, SwitchProps<T>>) => {
  const [local, others] = splitProps(props as SwitchProps, ["class"]);
  return (
    <SwitchPrimitive.Root class={cn("items-top flex space-x-2", local.class)} {...others} />
  );
};

type SwitchControlProps<T extends ValidComponent = "input"> =
  SwitchPrimitive.SwitchControlProps<T> & { class?: string | undefined };

const SwitchControl = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, SwitchControlProps<T>>
) => {
  const [local, others] = splitProps(props as SwitchControlProps, ["class", "children"]);
  return (
    <>
      <SwitchPrimitive.Input class="peer" />
      <SwitchPrimitive.Control
        class={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary",
          local.class
        )}
        {...others}
      >
        {local.children}
        <SwitchPrimitive.Thumb
          class={cn(
            "pointer-events-none block size-5 translate-x-0 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5"
          )}
        />
      </SwitchPrimitive.Control>
    </>
  );
};

export { Switch, SwitchControl, SwitchLabel, SwitchErrorMessage, SwitchDescription };
