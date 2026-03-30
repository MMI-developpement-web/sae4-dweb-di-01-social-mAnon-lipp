import { cva, type VariantProps } from "class-variance-authority";
import { cn, getImageUrl } from "../../lib/utils";
import placeholder from "../../assets/placeholder_account.jpg";

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

interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof avatarVariants> {}

const DEFAULT_AVATAR = placeholder;

export default function Avatar({
  size,
  className,
  src,
  alt = "Avatar",
  ...imgProps
}: AvatarProps) {
  const imageUrl = getImageUrl(src) || DEFAULT_AVATAR;

  return (
    <img
      {...imgProps}
      src={imageUrl}
      alt={alt}
      className={cn(avatarVariants({ size }), className)}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src !== DEFAULT_AVATAR) {
          img.src = DEFAULT_AVATAR;
        }
      }}
    />
  );
}
