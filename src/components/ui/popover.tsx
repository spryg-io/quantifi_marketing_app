"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
})

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback(
    (valueOrUpdater: React.SetStateAction<boolean>) => {
      const newValue =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(open)
          : valueOrUpdater
      if (!isControlled) {
        setInternalOpen(newValue)
      }
      onOpenChange?.(newValue)
    },
    [isControlled, open, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  )
}
Popover.displayName = "Popover"

interface PopoverTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(!open)
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(className)}
        onClick={handleClick}
        aria-expanded={open}
        {...props}
      />
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)
    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!open) return

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        const content = contentRef.current
        if (content && !content.parentElement?.contains(target)) {
          setOpen(false)
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [open, setOpen])

    if (!open) return null

    return (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(
          "absolute z-50 mt-1 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        style={{ marginTop: sideOffset }}
        {...props}
      />
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
