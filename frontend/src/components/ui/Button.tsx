import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[10px] font-poppins font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[0px_4px_19px_0px_rgba(119,147,65,0.3)] hover:bg-primary-hover",
        secondary:
          "bg-surface border border-border text-text hover:bg-gray-50",
        danger: "bg-danger text-white hover:bg-danger-hover",
        ghost: "bg-transparent text-text hover:bg-gray-100",
        outline:
          "bg-transparent border border-primary text-primary hover:bg-primary/10",
      },
      size: {
        xs: "h-[33px] px-6 text-base",
        sm: "h-9 px-4 text-sm",
        md: "h-[54px] px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "size-9 p-0",
      },
    },
    compoundVariants: [
      // Bouton icône ghost → forme circulaire
      {
        variant: "ghost",
        size: "icon",
        class: "rounded-full",
      },
      // Bouton icône outline → cercle avec bordure renforcée
      {
        variant: "outline",
        size: "icon",
        class: "rounded-full border-2",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
