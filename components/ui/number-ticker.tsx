"use client"

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider"
import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

const BASE_CLASS =
  // Callers supply the text color; tailwind-merge cannot reliably
  // collapse a registry color against the project's tokens.
  "inline-block tracking-wider tabular-nums"

function format(value: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(value.toFixed(decimalPlaces)))
}

function AnimatedTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = format(Number(latest), decimalPlaces)
        }
      }),
    [springValue, decimalPlaces]
  )

  return (
    <span ref={ref} className={cn(BASE_CLASS, className)} {...props}>
      {startValue}
    </span>
  )
}

export function NumberTicker(props: NumberTickerProps) {
  const { reduced } = useMotionPreference()

  if (reduced) {
    const { value, className, decimalPlaces = 0, ...rest } = props
    // Strip animation-only props so they are not forwarded to the DOM.
    delete rest.startValue
    delete rest.direction
    delete rest.delay

    return (
      <span className={cn(BASE_CLASS, className)} {...rest}>
        {format(value, decimalPlaces)}
      </span>
    )
  }

  return <AnimatedTicker {...props} />
}
