import xlsx from 'xlsx';
import {dbPromise} from "./db";

// Function to generate Excel file from SQL query result
export const generateExcelFromQuery = async (query: string, filePath: string) => {
    const db = await dbPromise;

    // Execute the query and get the results
    const rows = await db.all(query);

    // Convert the rows into a worksheet
    const worksheet = xlsx.utils.json_to_sheet(rows);

    // Create a new workbook and append the worksheet
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Write the workbook to a file
    xlsx.writeFile(workbook, filePath);
}
