import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import * as SliderPrimitive from "@kobalte/core/slider";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";

type SliderProps<T extends ValidComponent = "div"> = SliderPrimitive.SliderRootProps<T> & {
  class?: string | undefined;
  label?: string | undefined;
};

const Slider = <T extends ValidComponent = "div">(props: PolymorphicProps<T, SliderProps<T>>) => {
  const [local, others] = splitProps(props as SliderProps, ["class", "label"]);
  return (
    <SliderPrimitive.Root
      class={cn("relative flex w-full touch-none select-none flex-col items-center", local.class)}
      {...others}
    >
      {local.label && (
        <div class="flex w-full justify-between">
          <SliderPrimitive.Label as={Label}>{local.label}</SliderPrimitive.Label>
          <SliderPrimitive.ValueLabel class="text-sm text-muted-foreground" />
        </div>
      )}
      <SliderPrimitive.Track class="relative h-2 w-full grow rounded-full bg-secondary">
        <SliderPrimitive.Fill class="absolute h-full rounded-full bg-primary" />
        <SliderPrimitive.Thumb class="top-[-6px] block size-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          <SliderPrimitive.Input />
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Track>
    </SliderPrimitive.Root>
  );
};

export { Slider };
