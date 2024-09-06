"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertMessage = exports.getMessagesFromLastNDays = exports.dbPromise = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const date_fns_tz_1 = require("date-fns-tz");
exports.dbPromise = (0, sqlite_1.open)({
    filename: './bot_database.db',
    driver: sqlite3_1.default.Database
});
const TimeZone = 'Asia/Vladivostok';
(async () => {
    const db = await exports.dbPromise;
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
const getMessagesFromLastNDays = async (days) => {
    const db = await exports.dbPromise;
    return await db.all(`SELECT * FROM messages WHERE order_date >= datetime('now', ?)`, [`-${days} days`]);
};
exports.getMessagesFromLastNDays = getMessagesFromLastNDays;
const insertMessage = async (order) => {
    const db = await exports.dbPromise;
    const orderDate = (0, date_fns_tz_1.toZonedTime)(Date.now(), TimeZone);
    const formattedOrderDate = (0, date_fns_tz_1.format)(orderDate, "yyyy-MM-dd'T'HH:mm", { timeZone: TimeZone });
    console.log(formattedOrderDate);
    await db.run('INSERT INTO messages (user_id, comments, order_date) VALUES (?, ?, ?)', [order.user_id, order.comments, formattedOrderDate]);
};
exports.insertMessage = insertMessage;
