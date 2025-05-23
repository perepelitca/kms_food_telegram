import { InputFile } from 'grammy';
import type { BotConversation, BotContext } from './types';
import { generateExcelFromQuery } from '../helpers/export';
import fs from 'fs';
import { dateToUtcIso, utcToZonedTime } from '../helpers/datetime';
import { validateAdminAccess } from '../helpers/validateAdminAccess';
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
  const isAdminUser = await validateAdminAccess(conversation, ctx);

  if (!isAdminUser) {
    return;
  }

  await ctx.reply(`***Что загрузить?***`, {
    reply_markup: createExportPicker(),
    parse_mode: 'MarkdownV2',
  });
  const exportResponse = await conversation.waitForCallbackQuery(
    new RegExp(`^(${additionDayPattern})$`),
  );
  // Delete the export message after receiving the response to avoid accidental clicking on other dates
  if (ctx.chat?.id && exportResponse?.msgId) {
    await ctx.api.deleteMessage(ctx.chat.id, exportResponse.msgId);
  }

  const exportDay: AdditionDay =
    (exportResponse.match[1]?.split(':')?.[1] as AdditionDay) ?? 'today';
  const { addDay, dayLabel } = additionDayMap[exportDay];

  await ctx.reply(ctx.emoji`${'check_mark_button'} Ищем заказы на ${dayLabel}...`);

  try {
    const filename = `${utcToZonedTime(dateToUtcIso(addDays(new Date(), addDay)), { formatStr: 'P' })} Заказы.xlsx`;
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
