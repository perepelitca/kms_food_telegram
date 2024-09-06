// import { Bot } from "grammy"
//
// // Create a bot object
// const bot = new Bot("7096890402:AAFSfFn91KkieRZfk88Osz_FcqHru2c_ris");
//
// // Register listeners to handle messages
// bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));
//
// // Start the bot (using long polling)
// bot.start();

import TelegramBot from 'node-telegram-bot-api';
import type {FileOptions} from 'node-telegram-bot-api';
import { InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import {insertMessage, getMessagesFromLastNDays} from "./db";
import {generateExcelFromQuery} from "./export";
import fs from 'fs';
// import Calendar from 'telegram-inline-calendar'
// import {Calendar} from 'telegram-inline-calendar';
// Listen for '/' command

const token = '7096890402:AAFSfFn91KkieRZfk88Osz_FcqHru2c_ris';
export const bot = new TelegramBot(token, { polling: true });
// const calendar = new Calendar(bot, {
//     date_format: 'DD-MM-YYYY',
//     language: 'ru'
// });

// bot.onText(/\/date/, (msg) => calendar.startNavCalendar(msg));

// bot.on("callback_query", (query) => {
//     if (query.message?.message_id == calendar.chats.get(query.message?.chat.id)) {
//         const res = calendar.clickButtonCalendar(query);
//         if (res !== -1 && query.message?.chat.id) {
//             bot.sendMessage(query.message.chat.id, "You selected: " + res);
//         }
//     }
// });

/////////////////////////////

// function sendOptions(chatId: number) {
//     const options: Array<Array<KeyboardButton>> = {
//         keyboard: [
//           ['/option1', '/option2', '/option3'],
//           ['/option4', '/option5']
//         ],
//         one_time_keyboard: true
//     };
  
//     bot.sendMessage(chatId, "Choose an option:", { reply_markup: options });
//   }

// bot.onText(/\//, (msg) => {
//     const chatId = msg.chat.id;
//     sendOptions(chatId);
//   });

//   bot.onText(/\/(option1|option2|option3|option4|option5)/, (msg, match) => {
//     const chatId = msg.chat.id;
//     const option = match?.[1]; // Get the selected option
//     bot.sendMessage(chatId, `You selected ${option}`);
//   });

  /////////////////////////////

// Function to generate a date picker
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
}

// Example bot command to export messages to Excel and send the file
bot.onText(/\/export/, async (msg): Promise<void> => {
    const chatId = msg.chat.id;

    const filename = 'exported_messages.xlsx';
    // Define the file path where the Excel file will be saved
    const filePath = `./${filename}`;

    try {
        // Generate the Excel file
        await generateExcelFromQuery('SELECT * FROM messages', filePath);

        // Create a Readable stream from the file
        const fileStream = fs.createReadStream(filePath);

        // Define file options (specify filename and contentType)
        const fileOptions: FileOptions= {
            filename,
            // Correct MIME type for Excel
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        // Send the file to the user using a stream
        await bot.sendDocument(chatId, fileStream, {}, fileOptions);

        // Delete the file after sending
        fs.unlinkSync(filePath);
    } catch (err) {
        console.error('File does not exist or failed to send:', err);
        bot.sendMessage(chatId, 'An error occurred while exporting the messages.');
    }
});

bot.onText(/\/start/, (msg): void => {
    const chatId = msg.chat.id;
    console.log(chatId)
    const keyboard: Array<Array<InlineKeyboardButton>> = [
        [{ text: 'Option 1', callback_data: '1' }],
        [{ text: 'Option 2', callback_data: '2' }],
        [{ text: 'Option 3', callback_data: '3' }]
    ];
    const replyMarkup: InlineKeyboardMarkup = { inline_keyboard: keyboard };
    bot.sendMessage(chatId, 'Please choose an option:', { reply_markup: replyMarkup });
});

// Handle /start command
bot.onText(/\/date/, (msg): void => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Please select a date:', generateDatePicker());
});

// Handle callback queries
bot.on('callback_query', (query): void => {
    const { id, data } = query;
    const [type, value] = (data?? '').split('_');

    // Logic to handle date selection
    if (type === 'year' || type === 'month' || type === 'day') {
        // Here you can store or process the selected year/month/day
        bot.answerCallbackQuery(id, { text: `You selected ${type}: ${value}` });
    }
});

bot.on('callback_query', (callbackQuery): void => {
    const chatId = callbackQuery.message?.chat.id;
    const messageId = callbackQuery.message?.message_id;
    const option = callbackQuery.data;
    bot.editMessageText(`Selected option: ${option}`, { chat_id: chatId, message_id: messageId });
});

// Example bot command to save a message
bot.onText(/\/save (.+)/, async (msg, match): Promise<void> => {
    const chatId = msg.chat.id;
    const userId = msg?.from?.id;
    const userMessage = match?.[1];

    if (!userId || !userMessage) {
        return
    }

    // await insertMessage(userId, userMessage);
    await insertMessage({
        user_id: userId,
        comments: userMessage,
        first_name: 'John',
        last_name: 'Doe',
        phone: '645435353',
        address: '123 Main St',
        delivery_date: '2021-10-10',
        duration: 7
    });

    bot.sendMessage(chatId, 'Message saved!');
});

// Example usage in a bot command
bot.onText(/\/getmessages (\d+)/, async (msg, match) : Promise<void> => {
    const chatId = msg.chat.id;
    const userInputDays = match?.[1];

    if (!userInputDays) {
        bot.sendMessage(chatId, 'Please choose 1, 3, or 7 days.');
        return
    }

    const days = parseInt(userInputDays, 10);

    if (![1, 3, 7].includes(days)) {
        bot.sendMessage(chatId, 'Please choose 1, 3, or 7 days.');
        return;
    }

    const messages = await getMessagesFromLastNDays(days);
    console.log(messages)
    const response = messages.map(row => `${row.order_date} - ${row.user_id}: ${row.comments}`).join('\n');
    bot.sendMessage(chatId, `Messages from the last ${days} days:\n${response}`);
});
