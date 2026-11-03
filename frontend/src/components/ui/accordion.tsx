"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({
  className,
  ...props
}: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-line-dark", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-bone transition-colors hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-300 sm:text-base",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-brass-300 transition-transform duration-200 group-data-panel-open:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn(
        "h-(--accordion-panel-height) overflow-hidden text-sm text-bone/65 transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      {...props}
    >
      <div className="pb-5 pr-8 leading-6">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
