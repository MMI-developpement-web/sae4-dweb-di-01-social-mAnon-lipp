import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const retweetVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none",
  {
    variants: {
      variant: {
        default: "text-gray-400",
        filled: "text-green-500",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface RetweetProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof retweetVariants> {
  hasRetweeted?: boolean;
  retweetCount?: number;
  onRetweet?: () => void;
  isLoading?: boolean;
}

export default function Retweet({
  variant,
  size,
  className,
  hasRetweeted = false,
  retweetCount = 0,
  onRetweet,
  isLoading = false,
  disabled,
  ...props
}: RetweetProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRetweet?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-green-50 disabled:hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed",
        hasRetweeted ? "text-green-500" : "text-gray-400",
        className
      )}
      whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 10 } as const}
      {...(props as any)}
    >
      <motion.svg
        className="flex-shrink-0"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-labelledby="retweetIconTitle"
        initial={{ scale: 1 }}
        animate={hasRetweeted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        <title id="retweetIconTitle">Retweet</title>
        <path d="M13 18L6 18L6 7"></path>
        <path d="M3 9L6 6L9 9"></path>
        <path d="M11 6L18 6L18 17"></path>
        <path d="M21 15L18 18L15 15"></path>
      </motion.svg>

      <motion.span
        className="text-sm font-medium"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {retweetCount}
      </motion.span>
      </motion.button>
  );
}
