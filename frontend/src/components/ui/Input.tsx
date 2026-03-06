import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "w-full rounded-[9px] border bg-surface px-3 py-2 text-sm font-poppins font-light placeholder:text-placeholder focus:outline-none focus:ring-2 transition-shadow",
  {
    variants: {
      variant: {
        default: "border-border focus:ring-primary/40",
        error: "border-danger focus:ring-danger/30 text-danger",
      },
      inputSize: {
        sm: "h-9 text-xs",
        md: "h-[57px] text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
}

export default function Input({
  variant,
  inputSize,
  label,
  id,
  className,
  ...props
}: InputProps) {
  // Génère un id stable si label fourni mais pas d'id explicite

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          className="font-poppins text-[14px] font-normal text-text"
        >
          {label}
        </label>
      )}
      <input
        className={cn(inputVariants({ variant, inputSize }), className)}
        {...props}
      />
    </div>
  );
}
