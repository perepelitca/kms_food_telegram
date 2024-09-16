import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDb } from './db';
import type { MyContext } from './conversations/types';
import { initConversations } from './conversations';
import { orderMenu } from './orderMenu';
import { emojiParser } from '@grammyjs/emoji';

// Load environment variables
dotenv.config();

// Initialize the database
(async () => {
  await initializeDb();
})();

const TelegramToken = process.env.TELEGRAM_TOKEN as string;
export const bot = new Bot<MyContext>(TelegramToken);

// Add emoji parser to the bot. This should be added before any other middleware that uses emojis
bot.use(emojiParser());

// Initialize conversations
initConversations(bot);

// Add the order menu to the bot
bot.use(orderMenu);

bot.api.setMyCommands([
  { command: 'start', description: 'Заказы 🛍️' },
  { command: 'export', description: 'Скачать xls файл 💾' },
]);

bot.command('start', async (ctx) => {
  await ctx.reply('Давайте посмотрим что сделать с заказом', { reply_markup: orderMenu });
});

bot.command('export', async (ctx) => {
  await ctx.conversation.enter('exportOrders');
});

bot.start();

// bot.command('go', (ctx) => calendar.startNavCalendar(ctx.msg));

// bot.command('change_order', async (ctx) => {
//   // await ctx.reply("Давайте посмотрим что сделать с заказом", { reply_markup: orderMenu });
//   // await ctx.conversation.enter('changeOrder');
// });

// await ctx.answerCallbackQuery();
// await ctx.editMessageText('Выберите день:', { reply_markup: createDayPicker(selectedMonth) });
