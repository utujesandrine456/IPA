import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Existing cn function
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Add generateToken function
export function generateToken(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        token += chars[randomIndex];
    }
    return token;
}
