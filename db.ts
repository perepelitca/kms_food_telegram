import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { format, toZonedTime } from 'date-fns-tz';

// Open a SQLite database
export const dbPromise = open({
    filename: './bot_database.db',
    driver: sqlite3.Database
});

const TimeZone = 'Asia/Vladivostok';

// Initialize the database with a simple table
(async () => {
    const db = await dbPromise;
    await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
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
})();

interface DbOrder {
    /**
     * The unique identifier for the order
     */
    id: number;
    /**
     * The user ID of the person who placed the order
     */
    user_id: number;
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

/**
 * Get messages from the last N days
 * @param days. The number of days to look back
 */
export const getMessagesFromLastNDays = async (days: number): Promise<Array<DbOrder>>  => {
    const db = await dbPromise;
    return await db.all<Array<DbOrder>>(
        `SELECT * FROM messages WHERE order_date >= datetime('now', ?)`,
        [`-${days} days`]
    );
}

/**
 * Insert a new message into the database
 * @param order. The order to insert
 */
export const insertMessage = async (order: Order): Promise<void> => {
    const db = await dbPromise;
    const orderDate = toZonedTime(Date.now(), TimeZone);
    const formattedOrderDate = format(orderDate, "yyyy-MM-dd'T'HH:mm", { timeZone: TimeZone });
    console.log(formattedOrderDate)

    await db.run('INSERT INTO messages (user_id, comments, order_date) VALUES (?, ?, ?)', [order.user_id, order.comments, formattedOrderDate]);

    // After inserting, check if we need to trim old records
    // await maintainMaxRecords();
}


// Function to maintain a maximum of 10,000 records
// async function maintainMaxRecords(maxRecords: number = 10000) {
//     const db = await dbPromise;
//
//     // Get the current number of records
//     const { count } = await db.get('SELECT COUNT(*) as count FROM messages');
//
//     if (count > maxRecords) {
//         const recordsToDelete = count - maxRecords;
//
//         // Delete the oldest records
//         await db.run(`
//       DELETE FROM messages
//       WHERE id IN (
//         SELECT id FROM messages ORDER BY timestamp ASC LIMIT ?
//       )
//     `, [recordsToDelete]);
//     }
// }
