import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDb } from './db';
import type { MyContext } from './conversations/types';
import { initConversations } from './conversations';

// Load environment variables
dotenv.config();

// Initialize the database
(async () => {
  await initializeDb();
})();

const TelegramToken = process.env.TELEGRAM_TOKEN as string;
export const bot = new Bot<MyContext>(TelegramToken);

// Initialize conversations
initConversations(bot);


bot.api.setMyCommands([
  { command: 'order', description: 'Сделать заказ 🍲' },
  { command: 'export', description: 'Скачать xls файл 💾' },
  { command: 'settings', description: 'Open settings' },
]);

bot.command('order', async (ctx) => {
  await ctx.conversation.enter('createOrder');
});

bot.command('export', async (ctx) => {
  await ctx.conversation.enter('exportOrders');
});

bot.start();

// bot.command('settings', async (ctx) => {
// const keyboard = new Keyboard()
//   .text("Yes, they certainly are").row()
//   .text("I'm not quite sure").row()
//   .text("No. 😈")
//   .resized().oneTime()
// const keyboard = new Keyboard()
//   .text("Yes").row()
//   .text("No")
//   .placeholder("Decide now!");
// const labels = [
//   "Yes, they certainly are",
//   "I'm not quite sure",
//   "No. 😈",
// ];
// const buttonRows = labels
//   .map((label) => [Keyboard.text(label)]);
// const keyboard = Keyboard.from(buttonRows).resized();
// await ctx.reply('xxx', {
//   reply_markup: keyboard,
// });
// await ctx.reply(
//   '<b>Hi!</b> <i>Welcome111</i> to <a href="https://grammy.dev">grammY</a>.',
//   { parse_mode: "HTML" },
// );
//
// await bot.api.sendMessage(
//   ctx.chatId,
//   "*Hi\\!* _Welcome_ to [grammY](https://grammy.dev)\\.",
//   { parse_mode: "MarkdownV2" },
// );
// ctx.react("😍")
// });

// Example bot command to export messages to Excel and send the file
// bot.on('business_message:forum_topic_edited', async (ctx) => {
//   return
//   await ctx.reply('Введите пароль администратора');
//   console.log('ctx: ', ctx);
//   // const { message: firstName } = await conversation.waitFor(':text');
//   const filename = 'exported_messages.xlsx';
//   // Define the file path where the Excel file will be saved
//   const filePath = `./${filename}`;
//
//   try {
//     // Generate the Excel file
//     await generateExcelFromQuery('SELECT * FROM messages', filePath);
//
//     // Create a Readable stream from the file
//     const fileStream = fs.createReadStream(filePath);
//     await ctx.replyWithDocument(new InputFile(fileStream, filename));
//
//     // Delete the file after sending
//     fs.unlinkSync(filePath);
//   } catch (err) {
//     console.error('File does not exist or failed to send:', err);
//     await ctx.reply('Упс, что-то пошло не так, попробуйте позже');
//   }
// });
