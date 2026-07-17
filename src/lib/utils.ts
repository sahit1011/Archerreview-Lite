import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className merge (shadcn/ui standard). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
