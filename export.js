"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcelFromQuery = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const db_1 = require("./db");
const generateExcelFromQuery = async (query, filePath) => {
    const db = await db_1.dbPromise;
    const rows = await db.all(query);
    const worksheet = xlsx_1.default.utils.json_to_sheet(rows);
    const workbook = xlsx_1.default.utils.book_new();
    xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Data');
    xlsx_1.default.writeFile(workbook, filePath);
};
exports.generateExcelFromQuery = generateExcelFromQuery;
