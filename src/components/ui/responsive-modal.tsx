"use client"

import * as React from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./drawer"

type ResponsiveModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

type ResponsiveModalContentProps = {
  children: React.ReactNode
  className?: string
  onInteractOutside?: (event: Event) => void
}

function ResponsiveModalContent({
  children,
  className,
  onInteractOutside,
}: ResponsiveModalContentProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        <div className="flex flex-col overflow-y-auto max-h-[calc(80vh-2rem)] px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      className={cn("sm:max-w-[500px] max-h-[90vh] overflow-y-auto", className)}
      onInteractOutside={onInteractOutside}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={cn("px-0 pt-2 pb-3", className)} {...props} />
  }

  return <DialogHeader className={className} {...props} />
}

function ResponsiveModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={cn("px-0 pt-4 pb-0", className)} {...props} />
  }

  return <DialogFooter className={className} {...props} />
}

function ResponsiveModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle className={cn("text-base", className)} {...props} />
  }

  return <DialogTitle className={className} {...props} />
}

function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
  }

  return <DialogDescription className={className} {...props} />
}

function ResponsiveModalClose({
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerClose {...props} />
  }

  return <DialogClose {...props} />
}

export {
  ResponsiveModal,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
}
