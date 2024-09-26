import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { dateToUtcIso } from './helpers/datetime';

let dbInstance: Database | null = null;

// Open a SQLite database
export const dbPromise = async (): Promise<Database> => {
  if (!dbInstance) {
    try {
      dbInstance = await open({
        filename: `${process.env.DB_PATH}`,
        driver: sqlite3.Database,
      });
    } catch (error) {
      console.error('Error opening the database', error);
      throw error;
    }
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
      order_date TEXT,
      last_updated TEXT
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

  /**
   * The timestamp when the order was last updated. This is in Asia/Khabarovsk time.
   */
  last_updated: string;
}

export type Order = Omit<DbOrder, 'order_date' | 'id' | 'last_updated'>;
export type Admin = Pick<DbOrder, 'user_id'>;

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
    'INSERT INTO orders (user_id, first_name, last_name, phone, address, comments, delivery_date, duration, order_date, last_updated) VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?)',
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
      // When order is created, `last updated` is the same as `order date`
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
 * Find an order by the user ID
 * @param userId. The user ID of the person who placed the order. This is Telegram's user ID.
 */
export const findOrderByUserId = async (userId: string): Promise<DbOrder | null> => {
  const db = await dbPromise();

  // Get the last order by the user
  const order = await db.get<DbOrder>(
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
 * Update the delivery address for an order
 * @param orderId. The ID of the order to update
 * @param address. The new address to set
 */
export const updateOrderDeliveryAddress = async (
  orderId: number,
  address: string,
): Promise<DbOrder | null> => {
  const db = await dbPromise();
  const timestamp = dateToUtcIso();

  // Get the last order by the user
  await db.run(
    `
    UPDATE orders
    SET address = ?,
        last_updated = ?
    WHERE id = ?;
  `,
    [address, timestamp, orderId],
  );

  const order = await db.get<DbOrder>(
    `
    SELECT * FROM orders
    WHERE id = ?;
  `,
    [orderId],
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

// /**
//  * Find an order by the last name and phone number
//  * @param lastName. The last name of the person who placed the order
//  * @param phone. The phone number of the person who placed the order
//  */
// export const findOrderByNameAndPhone = async (
//   lastName: string,
//   phone: string,
// ): Promise<Order | null> => {
//   const db = await dbPromise();
//   const currentUtcIso = dateToUtcIso();
//
//   const order = await db.get<DbOrder>(
//     `
//     SELECT * FROM orders
//     WHERE last_name = ? AND phone = ? AND order_date > ?
//     ORDER BY order_date ASC
//   `,
//     [lastName, phone, currentUtcIso],
//   );
//
//   return order ?? null;
// };
//
//
//
// /**
//  * Get orders from the last N days
//  * @param days. The number of days to look back
//  */
// export const getOrdersFromLastNDays = async (days: number): Promise<Array<DbOrder>> => {
//   const db = await dbPromise();
//   return await db.all<Array<DbOrder>>(
//     `SELECT * FROM orders WHERE order_date >= datetime('now', ?)`,
//     [`-${days} days`],
//   );
// };
