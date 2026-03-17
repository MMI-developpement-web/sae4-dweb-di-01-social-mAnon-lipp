import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const avatarVariants = cva(
  "object-cover flex-shrink-0 rounded-lg",
  {
    variants: {
      size: {
        xs: "w-6 h-6",
        sm: "w-10 h-10",
        md: "w-14 h-14",
        lg: "w-24 h-24",
        xl: "w-32 h-32",
      },
    },
    defaultVariants: { size: "md" },
  }
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt: string;
  className?: string;
}

const DEFAULT_AVATAR = "/placeholder_account.jpg";

export default function Avatar({ src, alt, size }: AvatarProps) {
  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      className={cn(avatarVariants({ size }))}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src !== DEFAULT_AVATAR) {
          img.src = DEFAULT_AVATAR;
        }
      }}
    />
  );
}
