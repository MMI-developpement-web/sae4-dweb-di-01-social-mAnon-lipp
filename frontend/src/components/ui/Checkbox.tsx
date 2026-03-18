import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const checkboxVariants = cva(
  "w-4 h-4 rounded border-2 border-primary cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "bg-white checked:bg-primary",
        error: "border-red-400 bg-white checked:bg-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof checkboxVariants> {}

export default function Checkbox({
  variant,
  className,
  ...props
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    />
  );
}
