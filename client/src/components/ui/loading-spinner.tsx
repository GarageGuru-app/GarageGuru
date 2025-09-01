import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <div className="relative">
        <Wrench 
          className={cn(
            sizeClasses[size],
            "text-blue-600 animate-spin origin-center"
          )}
          style={{
            animation: "spin 1.5s linear infinite"
          }}
        />
      </div>
      {text && (
        <p className={cn(
          textSizeClasses[size],
          "text-gray-600 dark:text-gray-300 animate-pulse"
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Full page loading overlay
export function FullPageLoader({ text = "Loading ServiceGuru..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Wrench className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ServiceGuru</h3>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        </div>
      </div>
    </div>
  );
}

// Inline loader for buttons and small areas
export function InlineLoader({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <Wrench 
      className={cn(
        size === "sm" ? "w-4 h-4" : "w-5 h-5",
        "text-current animate-spin",
        className
      )}
    />
  );
}