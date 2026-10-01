import { cn } from "@/lib/utils"

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  className?: string
  "aria-label"?: string
}

function Segmented<T extends string>({ value, onChange, options, className, ...rest }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={cn("inline-flex w-full rounded-xl bg-white/8 p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white",
            value === option.value && "bg-white text-slate-900 shadow-sm hover:text-slate-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export { Segmented }
