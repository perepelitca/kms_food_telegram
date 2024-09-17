import xlsx from 'xlsx';
import { dbPromise } from '../db';

// Function to generate Excel file from SQL query result
export const generateExcelFromQuery = async (filePath: string) => {
  const db = await dbPromise();

  // Select orders where delivery date is today and order them by last_updated
  const query = `
    SELECT * FROM orders
    WHERE date(delivery_date, '+10 hours') = date('now', 'start of day', '+10 hours')
    ORDER BY last_updated ASC
  `;

  // Execute the query and get the results
  const rows = await db.all(query);

  // Convert the rows into a worksheet
  const worksheet = xlsx.utils.json_to_sheet(rows);

  // Create a new workbook and append the worksheet
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, `Заказы на сегодня: ${rows.length} шт.`);

  // Write the workbook to a file
  xlsx.writeFile(workbook, filePath);
};
