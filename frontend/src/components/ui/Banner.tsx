import { cva, type VariantProps } from "class-variance-authority";
import { cn, getImageUrl } from "../../lib/utils";

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

interface BannerProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "height">,
    VariantProps<typeof bannerVariants> {}

export default function Banner({
  height,
  className,
  src,
  alt = "Banner",
  ...imgProps
}: BannerProps) {
  const imageUrl = getImageUrl(src);

  if (!imageUrl) {
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
      {...imgProps}
      src={imageUrl}
      alt={alt}
      className={cn(bannerVariants({ height }), className)}
    />
  );
}
