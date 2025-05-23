import { format, toZonedTime } from 'date-fns-tz';
import { isBefore, isSameDay, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// The hour deadline for accepting delivery orders for today, e.g. for today's delivery, the order must be placed before 9 AM
export const hourDeadlineDeliveryAccept = 9;

// The hour deadline for changing delivery orders for today, e.g. for today's delivery, the order can be changed before 3 PM
export const hourDeadlineDeliveryChange = 15;

// The timezone of the Far East region of Russia.
export const TimeZone = 'Asia/Vladivostok';

// The default date format used in the app
export const dayFormat = 'yyyy-MM-dd';

/**
 * Convert a date to a UTC ISO formatted string.
 * @example new Date() -> 2024-09-19T04:01:29.944Z
 * @param date. The date to convert. Defaults to the current date and time.
 */
export const dateToUtcIso = (date: Date | number = Date.now()): string =>
  new Date(date).toISOString();

/**
 * Convert a date string to a UTC ISO formatted string starting from the beginning of the day.
 * @param dateStr. The date string to convert.
 * @example '2024-09-19' -> '2024-09-19T00:00:00.000Z'
 */
export const dateStringToUtcIso = (dateStr: string): string =>
  new Date(`${dateStr}T00:00:00Z`).toISOString();

/**
 * Convert a UTC date string to the default app timezone.
 * @param date. UTC ISO formatted date string.
 * @param options. The options to customize the conversion.
 * formatStr. The format to convert the date to. Defaults to `PP` ('Sep 18, 2024')
 * subDaysCount. The number of days to subtract from the date. Defaults to 0.
 */
export const utcToZonedTime = (
  date: string,
  options: { formatStr?: string; subDaysCount?: number } = {},
): string => {
  const { formatStr = 'PP', subDaysCount = 0 } = options;

  // Parse the UTC date
  const parsedDate = parseISO(date);

  // Subtract one day from the parsed date
  const adjustedDate = subDays(parsedDate, subDaysCount);

  // Convert the parsed UTC date to Asia/Vladivostok time zone
  const zonedDate = toZonedTime(adjustedDate, TimeZone);

  // Convert the stored UTC date to the Asia/Vladivostok timezone
  return format(zonedDate, formatStr, { locale: ru });
};

// Function to get the current date in the specified timezone
export const getZonedDate = (date: Date | number = Date.now()): Date => {
  return toZonedTime(date, TimeZone);
};

/**
 * Check if the given date is today and before the specified time.
 * @param date. The date to check.
 * @param hour. The hour to check.
 * @param minute. The minute to check. Defaults to 0.
 */
export const isTodayBeforeTime = (date: Date, hour: number, minute: number = 0): boolean => {
  const currentDate = getZonedDate();

  // Check if the provided date is today
  if (!isSameDay(date, currentDate)) {
    return false;
  }

  // Create a new Date object for the specific time (hour:minute) today
  const specificTimeToday = new Date(currentDate);
  specificTimeToday.setHours(hour, minute, 0, 0);

  // Check if the current time is before the specific time today
  return isBefore(currentDate, specificTimeToday);
};

/**
 * Check if the order can be modified.
 * Orders can be modified if the delivery date is not today or if it's before 3 PM.
 * @param deliveryDate. The delivery date of the order.
 */
export const canChangeOrder = (deliveryDate: string): boolean => {
  // Get the current date and time in the Vladivostok timezone
  const now = toZonedTime(new Date(), TimeZone);

  // Get the delivery date of the order in the Vladivostok timezone
  const orderDeliveryDate = toZonedTime(deliveryDate, TimeZone);

  // Check if the delivery date is today
  const isDeliveryToday = isSameDay(now, orderDeliveryDate);

  // If the delivery date is today, check if it's already past 3 PM
  if (isDeliveryToday) {
    return isTodayBeforeTime(now, hourDeadlineDeliveryChange);
  }

  // If the delivery date is not today (i.e., it's in the future), the order can still be modified
  return true;
};
