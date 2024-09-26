import { isAdmin, addAdmin } from '../db';
import { InputFile } from 'grammy';
import type { BotConversation, BotContext } from './types';
import { generateExcelFromQuery } from '../helpers/export';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { dateToUtcIso, utcToZonedTime } from '../helpers/datetime';
import { InlineKeyboard } from 'grammy';
import { addDays } from 'date-fns';

/**
 * Create a keyboard for the user to select a date to export orders for
 */
export const createExportPicker = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text('Cегодня', 'export:today')
    .row()
    .text('Завтра', 'export:tomorrow')
    .row()
    .text('Послезавтра', 'export:afterTomorrow');
};

type AdditionDay = 'today' | 'tomorrow' | 'afterTomorrow';
/**
 * How many days to add to the current date to get the selected day when to export orders
 */
const additionDayMap: Record<
  AdditionDay,
  {
    addDay: number;
    dayLabel: string;
  }
> = {
  today: { addDay: 0, dayLabel: 'сегодня' },
  tomorrow: { addDay: 1, dayLabel: 'завтра' },
  afterTomorrow: { addDay: 2, dayLabel: 'послезавтра' },
};
const additionDays: Array<AdditionDay> = ['today', 'tomorrow', 'afterTomorrow'];
const additionDayPattern = additionDays.map((day) => `export:${day}`).join('|');

/**
 * Export orders to Excel file. Only admin users can export orders.
 */
export const exportOrders = async (conversation: BotConversation, ctx: BotContext) => {
  const userId = ctx.from?.id;
  const isAdminUser = userId && (await isAdmin(String(userId)));

  if (!isAdminUser) {
    await ctx.reply(ctx.emoji`${'locked'} Введите пароль администратора`);
    const { message: password, msgId } = await conversation.waitFor(':text', {});
    console.log('PASSWORD_HASH', process.env.PASSWORD_HASH);
    console.log('text', password?.text);
    const match = await bcrypt.compare(password?.text ?? '', process.env.PASSWORD_HASH as string);

    if (!match) {
      await ctx.reply(ctx.emoji`${'no_entry'} Access denied! ${'no_entry'}`);
      return;
    } else if (userId) {
      /** Delete the password message after receiving it.
       * This is to prevent the password from being stored in the chat
       */
      await ctx.api.deleteMessage(ctx.chat?.id as number, msgId);
      /**
       * Add user to admin list if password is correct so that they don't have to enter a password again
       */
      await addAdmin(String(userId));
    }
  }

  await ctx.reply(`***Что загрузить?***`, {
    reply_markup: createExportPicker(),
    parse_mode: 'MarkdownV2',
  });
  const exportResponse = await conversation.waitForCallbackQuery(
    new RegExp(`^(${additionDayPattern})$`),
    {
      otherwise: (ctx) => ctx.reply('Выберите день!', { reply_markup: createExportPicker() }),
    },
  );

  console.log('exportResponse', exportResponse.match[1]);

  const exportDay = (exportResponse.match[1]?.split(':')?.[1] as AdditionDay) ?? 'today';
  const { addDay, dayLabel } = additionDayMap[exportDay];

  await ctx.reply(ctx.emoji`${'check_mark_button'} Ищем заказы на ${dayLabel}...`);

  try {
    const filename = `${utcToZonedTime(dateToUtcIso(addDays(new Date(), addDay)), 'P')} Заказы.xlsx`;
    // Define the file path where the Excel file will be saved
    const filePath = `./${filename}`;
    // Generate the Excel file
    const hasOrdersForToday = await generateExcelFromQuery(filePath, addDay);

    if (!hasOrdersForToday) {
      await ctx.reply(ctx.emoji`${'face_with_monocle'} На ${dayLabel} нет заказов...`);
      return;
    }

    // Create a Readable stream from the file
    const fileStream = fs.createReadStream(filePath);
    await ctx.replyWithDocument(new InputFile(fileStream, filename));

    // Delete the file after sending
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('File does not exist or failed to send:', err);
    await ctx.reply(ctx.emoji`Упс, что-то пошло не так, попробуйте позже ${'thinking_face'}`);
  }

  return;
};
