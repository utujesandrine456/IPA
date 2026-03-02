import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    iconLeft?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, iconLeft, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {iconLeft && (
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral/40">
                            {iconLeft}
                        </span>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-11 w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                            iconLeft && "pl-9",
                            error && "border-error focus-visible:ring-error",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
