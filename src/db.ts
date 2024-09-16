import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { dateToUtcIso } from './helpers/datetime';

/**
 * 1. toZonedTime(date, timeZone)
 *
 *    •	Purpose: Converts a UTC date to the corresponding local time in the specified timezone.
 *    •	Example: Convert a UTC date to Asia/Vladivostok local time.
 *
 *    const { toZonedTime } = require('date-fns-tz');
 *
 * // Example date in UTC (let's say incoming as UTC string)
 * const utcDate = '2024-09-09T10:00:00.000Z';
 *
 * // Convert to Asia/Vladivostok time
 * const vladivostokTime = toZonedTime(utcDate, 'Asia/Vladivostok');
 *
 * console.log(vladivostokTime);
 * //=> Will show a date in local Vladivostok time
 *
 *  In this case, toZonedTime ensures that the date is adjusted to the equivalent local time in the specified timezone
 *  (Asia/Vladivostok) without changing the actual date object itself. If you format this date, it will display the correct local time.
 *
 *
 * 2. fromZonedTime(date, timeZone)
 *
 *    •	Purpose: Takes a local time in a specific timezone and converts it to the equivalent UTC time.
 *    •	Example: If you have a local time in Asia/Vladivostok, you can convert it back to UTC for storing in your SQLite database.
 *
 *    const { fromZonedTime } = require('date-fns-tz');
 *
 * // Example local date in Asia/Vladivostok timezone
 * const vladivostokLocalTime = new Date(2024, 8, 9, 22, 0); // September 9, 10 PM Vladivostok time
 *
 * // Convert this local Vladivostok time to UTC for storage
 * const utcDateForStorage = fromZonedTime(vladivostokLocalTime, 'Asia/Vladivostok');
 *
 * console.log(utcDateForStorage);
 * //=> Will give the equivalent UTC time (2024-09-09T12:00:00.000Z for example)
 *
 * This is useful when you need to store dates in a database like SQLite in a standardized format (e.g., UTC).
 *
 *
 * Storing Dates in SQLite (Example Workflow)
 *
 *    1.	Convert Incoming Requests to UTC Using Vladivostok Timezone: !!!
 * When you receive a date from an incoming request, first convert it to Asia/Vladivostok time using toZonedTime, and then use fromZonedTime to convert it to UTC for storage in SQLite.
 *    2.	Example Code:
 *    const { toZonedTime, fromZonedTime, format } = require('date-fns-tz');
 *
 * // Incoming date (could be in any timezone, assume it's in UTC here)
 * const incomingDate = '2024-09-09T10:00:00.000Z';
 *
 * // Convert to Vladivostok local time
 * const vladivostokTime = toZonedTime(incomingDate, 'Asia/Vladivostok');
 *
 * // Convert Vladivostok local time to UTC for storage
 * const utcForStorage = fromZonedTime(vladivostokTime, 'Asia/Vladivostok');
 *
 * // Format the UTC date to ISO string for SQLite storage
 * const formattedUtcDate = format(utcForStorage, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
 *
 * console.log('Date to store in SQLite (UTC):', formattedUtcDate);
 * //=> This is the UTC date that you will store in the SQLite database.
 *
 *
 * Querying Dates in Asia/Vladivostok Timezone
 *
 * When querying dates (e.g., between 10pm yesterday and 9am today in Asia/Vladivostok timezone), you can:
 *
 *    1.	Convert Your Query Time Range from Asia/Vladivostok to UTC before querying the SQLite database.
 *    2.	Example Query Time Range:
 *
 *
 *    const { startOfDay, subDays, setHours } = require('date-fns');
 *
 * // Get the current date in Vladivostok timezone
 * const currentDate = new Date();
 * const vladivostokCurrentDate = toZonedTime(currentDate, 'Asia/Vladivostok');
 *
 * // Get 10 PM yesterday in Vladivostok
 * const yesterday10PM = setHours(subDays(vladivostokCurrentDate, 1), 22);
 *
 * // Get 9 AM today in Vladivostok
 * const today9AM = setHours(vladivostokCurrentDate, 9);
 *
 * // Convert both to UTC for querying the database
 * const startUtcQueryDate = fromZonedTime(yesterday10PM, 'Asia/Vladivostok');
 * const endUtcQueryDate = fromZonedTime(today9AM, 'Asia/Vladivostok');
 *
 * console.log('Start UTC for Query:', startUtcQueryDate);
 * console.log('End UTC for Query:', endUtcQueryDate);
 *
 * Summary:
 *
 *    •	Use toZonedTime to convert any UTC date to a local date in Asia/Vladivostok.
 *    •	Use fromZonedTime to convert local Asia/Vladivostok dates back to UTC for standardized storage in SQLite.
 *    •	Query using the same pattern: convert the Vladivostok time range to UTC for querying the database.
 *
 *
 *
 *
 *        Parse the stored UTC date from the database.
 *    2.	Convert the UTC date to the Asia/Vladivostok timezone using the toZonedTime function.
 *    3.	Format the date to the desired format for display.
 *
 * Here’s how you can do it with date-fns-tz:
 *
 * const { toZonedTime, format } = require('date-fns-tz');
 *
 * // Example of UTC date stored in the database (ISO format) !!!
 * const utcDateFromDB = '2024-09-09T12:00:00.000Z';
 *
 * // Convert the stored UTC date to the Asia/Vladivostok timezone
 * const vladivostokTime = toZonedTime(utcDateFromDB, 'Asia/Vladivostok');
 *
 * // Format the Vladivostok local time for displaying in the UI
 * const formattedVladivostokDate = format(vladivostokTime, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: 'Asia/Vladivostok' });
 *
 * console.log('Date to display in UI:', formattedVladivostokDate);
 * //=> Will display the date in Asia/Vladivostok timezone, e.g., "2024-09-09 22:00:00+10:00"
 *
 * Explanation:
 *
 *    •	Stored UTC Date: In this example, the UTC date '2024-09-09T12:00:00.000Z' is the one fetched from the database.
 *    •	Convert UTC to Vladivostok Time: The toZonedTime function is used to convert the UTC date to the local Asia/Vladivostok time.
 *    •	Format for UI: Using the format function, you can format the date in a human-readable format. The format yyyy-MM-dd HH:mm:ssXXX will display the date as "2024-09-09 22:00:00+10:00" (or whatever the Vladivostok local time is).
 *
 *
 *
 *    fromZonedTime(toZonedTime(new Date(), 'Asia/Vladivostok'), 'Asia/Vladivostok')
 *    > 2024-09-09T04:32:19.036Z
 *
 *    format(fromZonedTime(toZonedTime(new Date(), 'Asia/Vladivostok'), 'Asia/Vladivostok'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
 *    > 2024-09-09T00:32:54.116-04:00
 *
 *    format(toZonedTime('2024-09-09T00:23:00.545-04:00', 'Asia/Vladivostok'), "yyyy-MM-dd HH:mm:ssXXX", { timeZone: 'Asia/Vladivostok' });
 *    > 2024-09-09 14:23:00-04:00
 */

// process.env.NODE_ENV

let dbInstance: Database | null = null;

// Open a SQLite database
export const dbPromise = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: `${process.env.DB_PATH}`,
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
};

// Initialize the database with the necessary tables
export const initializeDb = async () => {
  const db = await dbPromise();

  /**
   * Create the orders table if it doesn't exist
   */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      address TEXT,
      delivery_date TEXT,
      duration INTEGER,
      comments TEXT,
      order_date TEXT
    )
  `);

  /**
   * Create the admins table if it doesn't exist. This table is used to store the user IDs of the admins.
   * When admin is found in this table, they don't need to enter the password to export the orders.
   */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT UNIQUE
    )
  `);
};

export interface DbOrder {
  /**
   * The unique identifier for the order
   */
  id: number;
  /**
   * The user ID of the person who placed the order
   */
  user_id: string;
  /**
   * The first name of the person who placed the order
   */
  first_name: string;
  /**
   * The last name of the person who placed the order
   */
  last_name: string;
  /**
   * The phone number of the person who placed the order
   */
  phone: string;
  /**
   * The address where the order should be delivered
   */
  address: string;
  /**
   * The date and time when the order should be delivered
   */
  delivery_date: string;
  /**
   * The duration of the order in days
   */
  duration: number;
  /**
   * Any additional comments or instructions for the order, e.g. allergies or dietary restrictions
   */
  comments?: string;
  /**
   * The timestamp when the order was placed. This is in Asia/Khabarovsk time.
   */
  order_date: string;
}

export type Order = Omit<DbOrder, 'order_date' | 'id'>;
export type Admin = Pick<DbOrder, 'user_id'>;

/**
 * Get orders from the last N days
 * @param days. The number of days to look back
 */
export const getOrdersFromLastNDays = async (days: number): Promise<Array<DbOrder>> => {
  const db = await dbPromise();
  return await db.all<Array<DbOrder>>(
    `SELECT * FROM orders WHERE order_date >= datetime('now', ?)`,
    [`-${days} days`],
  );
};

/**
 * Insert a new message into the database
 * @param order. The order to insert
 */
export const addOrder = async ({
  user_id,
  first_name,
  last_name,
  address,
  comments,
  delivery_date,
  duration,
  phone,
}: Order): Promise<void> => {
  const db = await dbPromise();
  const orderTimestamp = dateToUtcIso();
  await db.run(
    'INSERT INTO orders (user_id, first_name, last_name, phone, address, comments, delivery_date, duration, order_date) VALUES (?, ?, ?, ?, ?, ?,?, ?, ?)',
    [
      user_id,
      first_name,
      last_name,
      phone,
      address,
      comments,
      delivery_date,
      duration,
      orderTimestamp,
    ],
  );

  // After inserting, check if we need to trim old records
  // await maintainMaxRecords();
};

/**
 * Add an admin to the database
 * @param admin_id. The user ID of the admin to add
 */
export const addAdmin = async (admin_id: string): Promise<void> => {
  const db = await dbPromise();
  await db.run('INSERT OR IGNORE INTO admins (admin_id) VALUES (?);', [admin_id]);

  // After inserting, check if we need to trim old records
  // await maintainMaxRecords();
};

/**
 * Get all the orders in the database
 * @returns An array of all the orders
 */
export const getAdminIds = async (): Promise<Array<string>> => {
  const db = await dbPromise();
  return await db.all<Array<string>>(`SELECT admin_id FROM admins`);
};

/**
 * Check if a user is an admin
 * @param admin_id. The user ID to check
 */
export const isAdmin = async (admin_id: Admin['user_id']): Promise<boolean> => {
  const db = await dbPromise();
  const admin = await db.get<Admin['user_id']>(`SELECT * FROM admins WHERE admin_id = ?`, [
    admin_id,
  ]);
  return Boolean(admin);
};

/**
 * Find an order by the last name and phone number
 * @param lastName. The last name of the person who placed the order
 * @param phone. The phone number of the person who placed the order
 */
export const findOrderByNameAndPhone = async (
  lastName: string,
  phone: string,
): Promise<Order | null> => {
  const db = await dbPromise();
  const currentUtcIso = dateToUtcIso();

  const order = await db.get<Order>(
    `
    SELECT * FROM orders
    WHERE last_name = ? AND phone = ? AND order_date > ?
    ORDER BY order_date ASC
  `,
    [lastName, phone, currentUtcIso],
  );

  return order ?? null;
};

/**
 * Find an order by the user ID
 * @param userId. The user ID of the person who placed the order. This is Telegram's user ID.
 */
export const findOrderByUserId = async (userId: string): Promise<Order | null> => {
  const db = await dbPromise();

  // Get the last order by the user
  const order = await db.get<Order>(
    `
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY order_date DESC
  `,
    [userId],
  );

  return order ?? null;
};

/**
 * Delete all admins from the database
 */
export const dropAdmins = async (): Promise<void> => {
  const db = await dbPromise();
  await db.run(`DELETE FROM admins`);
};

/**
 * Delete all orders from the database
 */
export const dropOrders = async (): Promise<void> => {
  const db = await dbPromise();
  await db.run(`DELETE FROM orders`);
};

// TODO
// Function to maintain a maximum of 10,000 records
// async function maintainMaxRecords(maxRecords: number = 10000) {
//     const db = await dbPromise();
//
//     // Get the current number of records
//     const { count } = await db.get('SELECT COUNT(*) as count FROM orders');
//
//     if (count > maxRecords) {
//         const recordsToDelete = count - maxRecords;
//
//         // Delete the oldest records
//         await db.run(`
//       DELETE FROM orders
//       WHERE id IN (
//         SELECT id FROM orders ORDER BY timestamp ASC LIMIT ?
//       )
//     `, [recordsToDelete]);
//     }
// }
