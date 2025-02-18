import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns'
import { set } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getHeaders = (token?: string) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  "Content-Type": "application/json",
});

export const formatTimeFromMinutes = (minutes: number) => {
  const date = set(new Date(), {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  });
  const formattedTime = format(date, "h:mm a");
  return formattedTime;
};

