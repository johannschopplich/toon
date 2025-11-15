import * as React from "react";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

import { buttonVariants } from "./button-variants";

import type { VariantProps } from "class-variance-authority";

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}


export { Button }

