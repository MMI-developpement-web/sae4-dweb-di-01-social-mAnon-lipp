import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const textareaVariants = cva(
  "w-full rounded-md border bg-surface font-poppins font-medium text-text placeholder:text-placeholder resize-none focus:outline-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-border focus:border-primary/60",
        post: "border-primary/60 focus:border-primary placeholder:text-border-muted",
        error: "border-danger focus:ring-2 focus:ring-danger/30 text-danger",
      },
      textareaSize: {
        sm: "h-24 px-3 py-2 text-xs",
        md: "h-40 px-4 py-3 text-sm",
      },
    },
    compoundVariants: [
      {
        variant: "post",
        textareaSize: "md",
        class: "border-3",
      },
      {
        variant: "error",
        textareaSize: "md",
        class: "border-2",
      },
    ],
    defaultVariants: {
      variant: "default",
      textareaSize: "md",
    },
  }
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
}

export default function Textarea({
  variant,
  textareaSize,
  error,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <textarea
        className={cn(
          textareaVariants({ variant: error ? "error" : variant, textareaSize }),
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger font-poppins">{error}</span>
      )}
    </div>
  );
}
