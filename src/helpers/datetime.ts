import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { isBefore, isSameDay } from 'date-fns';
// import { ru } from 'date-fns/locale'

// The timezone of the Far East region of Russia.
export const TimeZone = 'Asia/Vladivostok';

/**
 * Convert a date to a UTC ISO formatted string.
 * This is to handle the case when orders are placed in different timezones. e.g. Moscow, but it should
 * be stored in UTC in the database.
 * @param date. The date to convert. Defaults to the current date and time.
 */
export const dateToUtcIso = (date: Date | number = Date.now()): string => {
  const orderDate = toZonedTime(date, TimeZone);
  const orderDateUTC = fromZonedTime(orderDate, TimeZone);

  return format(orderDateUTC, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
};

/**
 * Convert a UTC date string to the default app timezone.
 * @param date. UTC ISO formatted date string.
 */
export const utcToZonedTime = (date: string): string => {
  // Convert the stored UTC date to the Asia/Vladivostok timezone
  const timeInTz = toZonedTime(date, TimeZone);
  return format(timeInTz, 'yyyy-MM-dd HH:mm', { timeZone: TimeZone });
};

// Function to get the current date in the specified timezone
export const getZonedDate = (date: Date | number = Date.now()): Date => {
  return toZonedTime(date, TimeZone);
};

// Check if the given date is today and before the specified time in Vladivostok timezone
export const isTodayBeforeTime = (date: Date, hour: number, minute: number = 0): boolean => {
  const currentDate = getZonedDate();
  const providedDate = format(date, 'yyyy-MM-dd', { timeZone: TimeZone });
  const todayDate = format(currentDate, 'yyyy-MM-dd', { timeZone: TimeZone });

  if (providedDate !== todayDate) {
    return false; // Not today
  }

  // If it's today, check if the time is before the specified hour and minute
  const specificTimeToday = new Date(currentDate);
  specificTimeToday.setHours(hour, minute, 0, 0);

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
    const threePMToday = new Date(now);
    threePMToday.setHours(15, 0, 0, 0); // Set the time to 3 PM

    // If it's past 3 PM today, the order cannot be modified
    return isBefore(now, threePMToday);
  }

  // If the delivery date is not today (i.e., it's in the future), the order can still be modified
  return true;
};
