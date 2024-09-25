import { addOrder } from '../db';
import type { BotConversation, BotContext } from './types';
import { askForPhoneNumber } from '../helpers/phone';
import { InlineKeyboard } from 'grammy';
import {
  getZonedDate,
  TimeZone,
  isTodayBeforeTime,
  dateStringToUtcIso,
  dayFormat,
} from '../helpers/datetime';
import { addMonths, getDaysInMonth, isBefore } from 'date-fns';
import { format } from 'date-fns-tz';
import { showOrderInfo } from '../helpers/showOrderInfo';

const commentEmptyValues = [' ', '-', 'нет', '_'];

// Generate a keyboard for the user to select a month
export const createMonthPicker = (): InlineKeyboard => {
  const currentDate = getZonedDate();
  const nextMonthDate = addMonths(currentDate, 1);

  const currentMonth = format(currentDate, 'MMMM yyyy', { timeZone: TimeZone });
  const nextMonth = format(nextMonthDate, 'MMMM yyyy', { timeZone: TimeZone });

  return new InlineKeyboard()
    .text(currentMonth, 'select_month:current')
    .row()
    .text(nextMonth, 'select_month:next');
};

// Generate a keyboard to pick a day from a selected month
export const createDayPicker = (selectedMonth: Date): InlineKeyboard => {
  const currentDate = getZonedDate();
  const daysInMonth = getDaysInMonth(selectedMonth);
  const keyboard = new InlineKeyboard();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = getZonedDate(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day),
    );

    // Skip past dates
    if (isBefore(dayDate, currentDate)) continue;

    // Skip today if it's after 9am
    if (
      format(dayDate, dayFormat) === format(currentDate, dayFormat) &&
      !isTodayBeforeTime(dayDate, 9)
    ) {
      continue;
    }

    const dayLabel = format(dayDate, 'd');
    keyboard.text(dayLabel, `select_day:${format(dayDate, dayFormat)}`);

    if (day % 7 === 0) {
      keyboard.row(); // Add a new row after 7 days
    }
  }

  return keyboard;
};

// Generate a keyboard for the user to select if they have comments
// export const commentPicker = (): InlineKeyboard =>
//   new InlineKeyboard().text('Нет комментариев', 'nocomments');

// Create order conversation where user enters their order details
export const createOrder = async (conversation: BotConversation, ctx: BotContext) => {
  await ctx.reply(ctx.emoji`Начнем заказ! ${'handshake_light_skin_tone_no_skin_tone'}`);
  const createOrderSession = conversation.session.createOrder;

  // Duration of the order
  const durationEmoji = ctx.emoji`${'keycap_digit_one'}${'keycap_digit_two'}${'keycap_digit_three'}`;
  await ctx.reply(`***На сколько дней заказываете?*** ${durationEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  createOrderSession.duration = await conversation.form.number((ctx) => {
    const userDuration = parseInt(ctx?.msg?.text ?? '', 10);
    if (userDuration < 1) {
      return 'Количество дней должно быть больше 0';
    }
    return true;
  });

  // Delivery date
  const monthEmoji = ctx.emoji`${'calendar'}`;
  await ctx.reply(`***Выберите месяц:*** ${monthEmoji}`, {
    reply_markup: createMonthPicker(),
    parse_mode: 'MarkdownV2',
  });
  const monthResponse = await conversation.waitForCallbackQuery(/^select_month:(current|next)$/, {
    otherwise: (ctx) => ctx.reply('Выберите месяц!', { reply_markup: createMonthPicker() }),
  });

  const currentDate = getZonedDate();
  const selectedMonth =
    monthResponse.match[1] === 'current' ? currentDate : addMonths(currentDate, 1);

  const dayEmoji = ctx.emoji`${'sun'}`;
  await ctx.reply(`***Выберите дату:*** ${dayEmoji}`, {
    reply_markup: createDayPicker(selectedMonth),
    parse_mode: 'MarkdownV2',
  });
  const dayResponse = await conversation.waitForCallbackQuery(/^select_day:(\d{4}-\d{2}-\d{2})$/, {
    otherwise: (ctx) =>
      ctx.reply('Выберите дату!', { reply_markup: createDayPicker(selectedMonth) }),
  });
  createOrderSession.delivery_date = dateStringToUtcIso(dayResponse.match[1] ?? '');

  // First name
  const firstNameEmoji = ctx.emoji`${'person_raising_hand'}`;
  await ctx.reply(`***Введите ваше имя*** ${firstNameEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: firstName } = await conversation.waitFor(':text');
  createOrderSession.first_name = firstName?.text ?? '';

  // Last name
  const lastNameEmoji = ctx.emoji`${'passport_control'}`;
  await ctx.reply(`***Ваша фамилия*** ${lastNameEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: lastName } = await conversation.waitFor(':text');
  createOrderSession.last_name = lastName?.text ?? '';

  // Phone number
  createOrderSession.phone = await askForPhoneNumber(conversation, ctx);

  // Delivery address
  const addressEmoji = ctx.emoji`${'round_pushpin'}`;
  await ctx.reply(`***Ваш адрес*** ${addressEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: userAddress } = await conversation.waitFor(':text');
  createOrderSession.address = userAddress?.text ?? '';

  // Order comments (if any)
  const commentEmoji = ctx.emoji`${'scroll'}`;
  // TODO. How to skip commentPicker conversation when user didn't hit any button?
  // await ctx.reply(
  //   `***Укажите комментарий к заказу \\(аллергии, предпочтения и т\\.д\\.\\)*** ${commentEmoji} \n _Если нет комментариев, просто нажмите кнопку_`,
  //   {
  //     reply_markup: commentPicker(),
  //     parse_mode: 'MarkdownV2',
  //   },
  // );
  // const commentResponse = await conversation.waitForCallbackQuery('nocomments');
  // if (commentResponse.match === 'nocomments') {
  //   createOrderSession.comments = '';
  // } else {
  //   const { message: userComments } = await conversation.waitFor(':text');
  //   createOrderSession.comments = userComments?.text;
  // }
  await ctx.reply(
    `***Укажите комментарий к заказу \\(аллергии, предпочтения и т\\.д\\.\\)*** ${commentEmoji} \n _Если нет комментариев, напишите Нет или поставьте прочерк_`,
    {
      parse_mode: 'MarkdownV2',
    },
  );
  const { message } = await conversation.waitFor(':text');
  const userComments = message?.text ?? '';
  createOrderSession.comments = commentEmptyValues.includes(userComments) ? '' : userComments;

  const { first_name, last_name, phone, address, duration, comments, delivery_date } =
    createOrderSession;

  await addOrder({
    user_id: String(ctx.from?.id ?? ''),
    comments,
    first_name,
    last_name,
    phone,
    address,
    delivery_date,
    duration,
  });

  await showOrderInfo(ctx, createOrderSession, 'ваш заказ принят!');

  return;
};
