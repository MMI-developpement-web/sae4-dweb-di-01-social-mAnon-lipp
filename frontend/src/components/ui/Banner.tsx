import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const bannerVariants = cva(
  "w-full flex-shrink-0 object-cover",
  {
    variants: {
      height: {
        sm: "h-24",
        md: "h-32",
        lg: "h-40",
      },
    },
    defaultVariants: { height: "lg" },
  }
);

interface BannerProps extends VariantProps<typeof bannerVariants> {
  src?: string;
  alt?: string;
  className?: string;
}

export default function Banner({ src, alt = "Banner", height, className }: BannerProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "w-full bg-gradient-to-r from-blue-400 to-blue-600",
          bannerVariants({ height }),
          className
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(bannerVariants({ height }), className)}
    />
  );
}
