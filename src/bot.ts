import { Bot, GrammyError, HttpError } from 'grammy';
import dotenv from 'dotenv';
import { initializeDb, dropAdmins } from './db';
import type { BotContext } from './conversations/types';
import { initConversations } from './conversations';
import { orderMenu } from './orderMenu';
import { emojiParser } from '@grammyjs/emoji';
import { ConversationSession } from './conversations';

// Load environment variables
dotenv.config();

// Initialize the database
(async () => {
  await initializeDb();
})();

const TelegramToken = process.env.TELEGRAM_TOKEN as string;
export const bot = new Bot<BotContext>(TelegramToken);

// Add emoji parser to the bot. This should be added before any other middleware that uses emojis
bot.use(emojiParser());

// Initialize conversations
initConversations(bot);

// Add the order menu to the bot
bot.use(orderMenu);

bot.api.setMyCommands([
  { command: 'start', description: 'Заказы 🛍️' },
  { command: 'export', description: 'Скачать xls файл 💾' },
  // { command: 'drop_admins', description: 'Delete admins' },
  // { command: 'drop_orders', description: 'Delete orders' },
]);

bot.command('start', async (ctx) => {
  await ctx.conversation.exit(ConversationSession.ExportOrders);
  await ctx.reply('Давайте начнем!', { reply_markup: orderMenu });
});

bot.command('export', async (ctx) => {
  await ctx.conversation.exit(ConversationSession.CreateOrder);
  await ctx.conversation.enter(ConversationSession.ExportOrders, { overwrite: true });
});

bot.command('drop_admins', async (ctx) => {
  await dropAdmins();
  await ctx.reply('All admins have been deleted');
});

bot.command('drop_orders', async (ctx) => {
  await ctx.conversation.enter(ConversationSession.DropOrders, { overwrite: true });
});

/**
 * Error handling
 * @see https://grammy.dev/guide/errors#long-polling
 */
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

// Start the bot
bot.start();
