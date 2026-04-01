import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const replyVariants = cva(
  "inline-flex items-center justify-center gap-2 select-none",
  {
    variants: {
      variant: {
        default: "text-gray-400",
        active: "text-blue-500",
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

interface ReplyProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof replyVariants> {
  isActive?: boolean;
  replyCount?: number;
  onReply?: () => void;
  isLoading?: boolean;
}

export default function Reply({
  variant,
  size,
  className,
  isActive = false,
  replyCount = 0,
  onReply,
  isLoading = false,
  disabled,
  ...props
}: ReplyProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onReply?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-blue-50 disabled:hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed",
        isActive ? "text-blue-500" : "text-gray-400",
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
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </motion.svg>

      {replyCount > 0 && (
        <motion.span
          className="text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {replyCount}
        </motion.span>
      )}
    </motion.button>
  );
}
