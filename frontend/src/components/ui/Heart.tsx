import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const heartVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none",
  {
    variants: {
      variant: {
        default: "text-gray-400",
        filled: "text-red-500",
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

interface HeartProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof heartVariants> {
  isLiked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  onUnlike?: () => void;
  isLoading?: boolean;
}

export default function Heart({
  variant,
  size,
  className,
  isLiked = false,
  likeCount = 0,
  onLike,
  onUnlike,
  isLoading = false,
  disabled,
  ...props
}: HeartProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-red-50 disabled:hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed",
        isLiked ? "text-red-500" : "text-gray-400",
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
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ scale: 1 }}
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </motion.svg>

      {likeCount > 0 && (
        <motion.span
          className="text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {likeCount}
        </motion.span>
      )}
    </motion.button>
  );
}
