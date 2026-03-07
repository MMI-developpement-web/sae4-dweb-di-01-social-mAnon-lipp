import { cn } from "../lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthLabel = (level: number): string => {
    if (level === 0) return "Très faible";
    if (level === 1) return "Faible";
    if (level === 2) return "Moyen";
    if (level === 3) return "Bon";
    if (level === 4) return "Fort";
    return "Très fort";
  };

  const getStrengthColor = (level: number): string => {
    if (level === 0) return "bg-danger";
    if (level === 1) return "bg-danger";
    if (level === 2) return "bg-warning";
    if (level === 3) return "bg-success";
    if (level === 4) return "bg-success";
    return "bg-success";
  };

  if (!password) return null;

  const strength = calculateStrength(password);
  const widthPercentage = (strength / 5) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className={cn(
            "h-full transition-all duration-300",
            getStrengthColor(strength)
          )}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
      <span className="text-xs font-poppins text-text-muted">
        Force : {getStrengthLabel(strength)}
      </span>
    </div>
  );
}
