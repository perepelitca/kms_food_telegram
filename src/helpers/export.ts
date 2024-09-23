import xlsx from 'xlsx';
import { dbPromise, DbOrder } from '../db';
import { utcToZonedTime } from './datetime';

type ExcelRow = Omit<DbOrder, 'user_id' | 'id'>;

// Custom header mapping
const headerMapping: Record<keyof ExcelRow, string> = {
  first_name: 'Имя',
  last_name: 'Фaмилия',
  delivery_date: 'Дата доставки',
  order_date: 'Дата заказа',
  last_updated: 'Последнее обновление',
  duration: 'Количество дней',
  comments: 'Комментарии',
  phone: 'Телефон',
  address: 'Адрес доставки',
};
const dateFields = ['delivery_date', 'order_date', 'last_updated'];

// const query = `
//   SELECT * FROM orders
//   WHERE date(delivery_date) = date(CURRENT_TIMESTAMP, '+10 hours')
//   ORDER BY last_updated ASC
// `;

// Function to generate Excel file from SQL query result
export const generateExcelFromQuery = async (filePath: string) => {
  const db = await dbPromise();

  /**
   * Select orders where delivery date is today and order them by last_updated
   * Vladivostok is consistently UTC+10 (no daylight saving time)
   * 'start of day' + 10 hours: beginning of the current day in Vladivostok
   * 'start of day' + 34 hours: beginning of the next day in Vladivostok
   */
  const query = `
  SELECT first_name, last_name, delivery_date, order_date, last_updated, 
         duration, comments, phone, address 
  FROM orders
  WHERE delivery_date >= datetime('now', 'start of day', '+10 hours')
  AND delivery_date < datetime('now', 'start of day', '+34 hours')
  ORDER BY last_updated ASC`;

  const rows = await db.all<Array<DbOrder>>(query);

  // Format and rename fields
  const formattedRows = rows.map((row) => {
    const formattedRow: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(row)) {
      if (key in headerMapping) {
        const headerKey = headerMapping[key as keyof typeof headerMapping];
        if (dateFields.includes(key)) {
          formattedRow[headerKey] = utcToZonedTime(value as string, 'PP pp');
        } else {
          formattedRow[headerKey] = value;
        }
      }
    }
    return formattedRow;
  });

  // Convert the rows into a worksheet with custom headers
  const worksheet = xlsx.utils.json_to_sheet(formattedRows);

  // Apply conditional formatting
  formattedRows.forEach((row, index) => {
    if (row['Дата заказа'] !== row['Последнее обновление']) {
      const rowNumber = index + 2; // Data starts at row 2 since row 1 is the header
      Object.keys(headerMapping).forEach((_, colIndex) => {
        const cellAddress = xlsx.utils.encode_cell({ r: rowNumber - 1, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: 'FFD966' } }, // Light orange
          font: { color: { rgb: '000000' } }, // Ensure text is visible
        };
      });
    }
  });

  console.log('worksheet', JSON.stringify(worksheet, null, 2));
  // Set width to 20 for all columns
  worksheet['!cols'] = Object.keys(headerMapping).map(() => ({ wch: 20 }));

  // Create a new workbook and append the worksheet
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, `Заказы на сегодня: ${rows.length} шт.`);

  // Write the workbook to a file
  xlsx.writeFile(workbook, filePath);
};
