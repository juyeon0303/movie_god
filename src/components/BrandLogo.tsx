interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl sm:text-4xl",
} as const;

/** TrashCut — Cut은 항상 레이저 레드 */
export function BrandLogo({ size = "lg", className = "" }: BrandLogoProps) {
  return (
    <span
      className={`font-sans font-bold tracking-tight ${sizeClass[size]} ${className}`}
    >
      Trash<span className="neon-laser text-laser">Cut</span>
    </span>
  );
}
