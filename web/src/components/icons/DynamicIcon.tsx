import React from "react";
import * as LucideIcons from "lucide-react";

interface DynamicIconProps extends Omit<React.ComponentProps<"svg">, "ref"> {
    name: string;
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
}

export function DynamicIcon({
    name,
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    ...props
}: DynamicIconProps) {
    // Try to find the icon by exact name (e.g., "Flame")
    const Icon = (LucideIcons as any)[name];

    // Check if Icon exists and is a valid renderable component (a function or an object with $$typeof)
    if (!Icon || (typeof Icon !== "function" && typeof Icon !== "object")) {
        // Fallback if icon isn't found or invalid
        const FallbackIcon = LucideIcons.HelpCircle as React.ElementType;
        return <FallbackIcon size={size} color={color} strokeWidth={strokeWidth} {...props} />;
    }

    const ValidIcon = Icon as React.ElementType;
    return <ValidIcon size={size} color={color} strokeWidth={strokeWidth} {...props} />;
}
