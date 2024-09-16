import {format, fromZonedTime, toZonedTime} from "date-fns-tz";
import { isBefore } from "date-fns";
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
}

/**
 * Convert a UTC date string to the default app timezone.
 * @param date. UTC ISO formatted date string.
 */
export const utcToZonedTime = (date: string): string => {
    // Convert the stored UTC date to the Asia/Vladivostok timezone
    const timeInTz = toZonedTime(date, TimeZone);
    return format(timeInTz, "yyyy-MM-dd HH:mm", { timeZone: TimeZone });
}

// Function to get the current date in the specified timezone
export const getZonedDate = (date: Date | number = Date.now()): Date => {
    return toZonedTime(date, TimeZone);
};

// Check if the given date is today and before 9am in the Vladivostok timezone
export const isTodayBefore9am = (date: Date): boolean => {
    const currentDate = getZonedDate();
    const providedDate = format(date, "yyyy-MM-dd", { timeZone: TimeZone });
    const todayDate = format(currentDate, "yyyy-MM-dd", { timeZone: TimeZone });

    if (providedDate !== todayDate) {
        return false; // Not today
    }

    // If it's today, check if the time is before 9 AM
    const nineAMToday = new Date(currentDate);
    nineAMToday.setHours(9, 0, 0, 0);

    return isBefore(currentDate, nineAMToday);
};
