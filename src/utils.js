import { twMerge } from 'tailwind-merge';
import { clsx } from "clsx";

export function cn(...input) {
    return twMerge(clsx(...input));
}