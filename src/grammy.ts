import { Bot, Context, InputFile, session, SessionFlavor } from 'grammy';
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import dotenv from 'dotenv';
import { type DbOrder, initializeDb, addOrder, isAdmin, addAdmin } from './db';
import { generateExcelFromQuery } from './helpers/export';
import fs from 'fs';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Initialize the database
(async () => {
  await initializeDb();
})();

type OrderData = Pick<DbOrder, 'first_name' | 'last_name' | 'phone' | 'address' | 'duration'>;
type CancelOrderData = Pick<DbOrder, 'last_name' | 'phone'>;
interface SessionData {
  /**
   * The data for the order that is currently being created
   */
  createOrder: OrderData;
  /**
   * The data for the order that is currently being changed
   */
  changeOrder: OrderData;
  /**
   * The data for the order that is currently being canceled
   */
  cancelOrder: CancelOrderData;
  /**
   * To store conversations per session
   * @see https://t.me/grammyjs/268859
   */
  conversation: any;
  exportOrders: Record<string, string>;
}
type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;
type MyConversation = Conversation<MyContext>;

const TelegramToken = process.env.TELEGRAM_TOKEN as string;
const bot = new Bot<MyContext>(TelegramToken);

// Install the session plugin.
bot.use(
  session({
    type: 'multi',
    createOrder: {
      initial: () => ({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        duration: 0,
      }),
    },
    changeOrder: {
      initial: () => ({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        duration: 0,
      }),
    },
    cancelOrder: {
      initial: () => ({
        last_name: '',
        phone: '',
      }),
    },
    exportOrders: {},
    conversation: {},
  }),
);

bot.use(conversations());

// bot.use(
//   session({
//     initial: () => ({
//       first_name: '',
//       last_name: '',
//       phone: '',
//       address: '',
//       duration: 0,
//     }),
//     /**
//      * Note that using `session()` will only save the data in-memory. If the Node.js
//      * process terminates, all data will be lost. A bot running in production will
//      * need some sort of database or file storage to persist data between restarts.
//      * Confer the grammY documentation to find out how to store data with your bot.
//      * bot.use(session({ initial: () => ({ messages: 1, edits: 0 }) }))
//      */
//     // storage: new MemorySessionStorage()
//     // storage: freeStorage<OrderData>(bot.token),
//   }),
// );

// Install the conversation plugin.

// const greeting = async (conversation: MyConversation, ctx: MyContext) => {
//   await ctx.reply('Начем заказ!');
//   await ctx.reply('На сколько дней заказываете?');
//   const {message} = await conversation.waitFor(':text')
//   console.log('message', message?.text)
//
//   await ctx.reply('Next');
// };

const makeOrder = async (conversation: MyConversation, ctx: MyContext) => {
  await ctx.reply('Начем заказ!');
  const createOrderSession = conversation.session.createOrder;

  await ctx.reply('На сколько дней заказываете?');
  createOrderSession.duration = await conversation.form.number((ctx) => {
    const userDuration = parseInt(ctx?.msg?.text ?? '', 10);
    if (userDuration < 1) {
      return 'Количество дней должно быть больше 0';
    }
    return true;
  });

  await ctx.reply('Введите ваше имя');
  const { message: firstName } = await conversation.waitFor(':text');
  createOrderSession.first_name = firstName?.text ?? '';

  await ctx.reply('Ваша фамилия');
  const { message: lastName } = await conversation.waitFor(':text');
  createOrderSession.last_name = lastName?.text ?? '';

  await ctx.reply('Ваш телефон в формате 9997772233');
  const { message: phoneNumber } = await conversation.waitFor(':text');
  createOrderSession.phone = phoneNumber?.text ?? '';

  await ctx.reply('Ваш адрес');
  const { message: userAddress } = await conversation.waitFor(':text');
  createOrderSession.address = userAddress?.text ?? '';

  const { first_name, last_name, phone, address, duration } = createOrderSession;

  if (ctx.chatId) {
    await addOrder({
      user_id: ctx.chatId,
      comments: 'comment',
      first_name,
      last_name,
      phone,
      address,
      delivery_date: '2021-10-10',
      duration,
    });

    await ctx.reply(`${createOrderSession.first_name}, ваш заказ принят!`);
  }
};

/**
 * Export orders to Excel file. Only admin users can export orders.
 */
const exportOrders = async (conversation: MyConversation, ctx: MyContext) => {
  const userId = ctx.from?.id;
  const isAdminUser = userId && (await isAdmin(String(userId)));

  if (!isAdminUser) {
    await ctx.reply('Enter admin password!');
    const { message: password } = await conversation.waitFor(':text');
    const match = await bcrypt.compare(password?.text ?? '', process.env.PASSWORD_HASH as string);

    if (!match) {
      await ctx.reply('⚠️ Access denied! ⚠️');
      return;
    } else {
      /**
       * Add user to admin list if password is correct so that they don't have to enter password again
       */
      userId && (await addAdmin(String(userId)));
    }
  }

  await ctx.reply(' ✅ Loading orders...');
  const filename = 'exported_messages.xlsx';
  // Define the file path where the Excel file will be saved
  const filePath = `./${filename}`;

  try {
    // Generate the Excel file
    await generateExcelFromQuery('SELECT * FROM messages', filePath);

    // Create a Readable stream from the file
    const fileStream = fs.createReadStream(filePath);
    await ctx.replyWithDocument(new InputFile(fileStream, filename));

    // Delete the file after sending
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('File does not exist or failed to send:', err);
    await ctx.reply('Упс, что-то пошло не так, попробуйте позже');
  }
};

bot.use(createConversation(makeOrder));
bot.use(createConversation(exportOrders));

bot.api.setMyCommands([
  { command: 'order', description: 'Сделать заказ 🍲' },
  { command: 'export', description: 'Скачать xls файл 💾' },
  { command: 'settings', description: 'Open settings' },
]);

bot.command('order', async (ctx) => {
  // await ctx.conversation.exit();
  await ctx.conversation.enter('makeOrder');
});

bot.command('export', async (ctx) => {
  await ctx.conversation.enter('exportOrders');
});

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

bot.start();
