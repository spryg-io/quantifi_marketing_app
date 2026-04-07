"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export interface CalendarProps {
  className?: string
  selected?: Date
  onSelect?: (date: Date) => void
  month?: Date
  maxDate?: Date
}

function Calendar({ className, selected, onSelect, month, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (month) return new Date(month.getFullYear(), month.getMonth(), 1)
    if (selected)
      return new Date(selected.getFullYear(), selected.getMonth(), 1)
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  React.useEffect(() => {
    if (month) {
      setCurrentMonth(new Date(month.getFullYear(), month.getMonth(), 1))
    }
  }, [month])

  const year = currentMonth.getFullYear()
  const monthIndex = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, monthIndex)
  const firstDay = getFirstDayOfMonth(year, monthIndex)
  const today = new Date()

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  const handleDayClick = (day: number) => {
    const date = new Date(year, monthIndex, day)
    onSelect?.(date)
  }

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>
        <div className="text-sm font-medium">
          {MONTH_NAMES[monthIndex]} {year}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {DAYS_OF_WEEK.map((day) => (
              <th
                key={day}
                className="h-8 w-8 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <td key={dayIndex} className="h-8 w-8" />
                }

                const date = new Date(year, monthIndex, day)
                const isSelected = selected ? isSameDay(date, selected) : false
                const isToday = isSameDay(date, today)
                const isDisabled = maxDate ? date > maxDate && !isSameDay(date, maxDate) : false

                return (
                  <td key={dayIndex} className="h-8 w-8 text-center p-0">
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      disabled={isDisabled}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                        isDisabled
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        isSelected &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                        !isSelected &&
                          isToday &&
                          !isDisabled &&
                          "bg-accent text-accent-foreground",
                        !isSelected &&
                          !isToday &&
                          !isDisabled &&
                          "text-foreground"
                      )}
                    >
                      {day}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
Calendar.displayName = "Calendar"

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export { Calendar }
