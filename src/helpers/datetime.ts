import {format, fromZonedTime, toZonedTime} from "date-fns-tz";
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
