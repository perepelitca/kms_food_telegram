"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const db_1 = require("./db");
const export_1 = require("./export");
const fs_1 = __importDefault(require("fs"));
const telegram_inline_calendar_1 = __importDefault(require("telegram-inline-calendar"));
const token = '7096890402:AAFSfFn91KkieRZfk88Osz_FcqHru2c_ris';
exports.bot = new node_telegram_bot_api_1.default(token, { polling: true });
const calendar = new telegram_inline_calendar_1.default(exports.bot, {
    date_format: 'DD-MM-YYYY',
    language: 'ru'
});
exports.bot.onText(/\/date/, (msg) => calendar.startNavCalendar(msg));
exports.bot.on("callback_query", (query) => {
    if (query.message?.message_id == calendar.chats.get(query.message?.chat.id)) {
        const res = calendar.clickButtonCalendar(query);
        if (res !== -1 && query.message?.chat.id) {
            exports.bot.sendMessage(query.message.chat.id, "You selected: " + res);
        }
    }
});
const generateDatePicker = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const yearButtons = years.map(year => [{ text: year.toString(), callback_data: `year_${year}` }]);
    const monthButtons = months.map(month => [{ text: month.toString().padStart(2, '0'), callback_data: `month_${month}` }]);
    const dayButtons = days.map(day => [{ text: day.toString().padStart(2, '0'), callback_data: `day_${day}` }]);
    return {
        reply_markup: {
            inline_keyboard: [
                ...yearButtons,
                ...monthButtons,
                ...dayButtons
            ]
        }
    };
};
exports.bot.onText(/\/export/, async (msg) => {
    const chatId = msg.chat.id;
    const filename = 'exported_messages.xlsx';
    const filePath = `./${filename}`;
    try {
        await (0, export_1.generateExcelFromQuery)('SELECT * FROM messages', filePath);
        const fileStream = fs_1.default.createReadStream(filePath);
        const fileOptions = {
            filename,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        await exports.bot.sendDocument(chatId, fileStream, {}, fileOptions);
        fs_1.default.unlinkSync(filePath);
    }
    catch (err) {
        console.error('File does not exist or failed to send:', err);
        exports.bot.sendMessage(chatId, 'An error occurred while exporting the messages.');
    }
});
exports.bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId);
    const keyboard = [
        [{ text: 'Option 1', callback_data: '1' }],
        [{ text: 'Option 2', callback_data: '2' }],
        [{ text: 'Option 3', callback_data: '3' }]
    ];
    const replyMarkup = { inline_keyboard: keyboard };
    exports.bot.sendMessage(chatId, 'Please choose an option:', { reply_markup: replyMarkup });
});
exports.bot.onText(/\/date/, (msg) => {
    const chatId = msg.chat.id;
    exports.bot.sendMessage(chatId, 'Please select a date:', generateDatePicker());
});
exports.bot.on('callback_query', (query) => {
    const { id, data } = query;
    const [type, value] = (data ?? '').split('_');
    if (type === 'year' || type === 'month' || type === 'day') {
        exports.bot.answerCallbackQuery(id, { text: `You selected ${type}: ${value}` });
    }
});
exports.bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message?.chat.id;
    const messageId = callbackQuery.message?.message_id;
    const option = callbackQuery.data;
    exports.bot.editMessageText(`Selected option: ${option}`, { chat_id: chatId, message_id: messageId });
});
exports.bot.onText(/\/save (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg?.from?.id;
    const userMessage = match?.[1];
    if (!userId || !userMessage) {
        return;
    }
    await (0, db_1.insertMessage)({
        user_id: userId,
        comments: userMessage,
        first_name: 'John',
        last_name: 'Doe',
        phone: '645435353',
        address: '123 Main St',
        delivery_date: '2021-10-10',
        duration: 7
    });
    exports.bot.sendMessage(chatId, 'Message saved!');
});
exports.bot.onText(/\/getmessages (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userInputDays = match?.[1];
    if (!userInputDays) {
        exports.bot.sendMessage(chatId, 'Please choose 1, 3, or 7 days.');
        return;
    }
    const days = parseInt(userInputDays, 10);
    if (![1, 3, 7].includes(days)) {
        exports.bot.sendMessage(chatId, 'Please choose 1, 3, or 7 days.');
        return;
    }
    const messages = await (0, db_1.getMessagesFromLastNDays)(days);
    console.log(messages);
    const response = messages.map(row => `${row.order_date} - ${row.user_id}: ${row.comments}`).join('\n');
    exports.bot.sendMessage(chatId, `Messages from the last ${days} days:\n${response}`);
});
