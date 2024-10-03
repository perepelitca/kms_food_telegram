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
  hourDeadlineDeliveryAccept,
} from '../helpers/datetime';
import {
  addMonths,
  getDaysInMonth,
  isBefore,
  getDate,
  addDays,
  subDays,
  parseISO,
  formatISO,
} from 'date-fns';
import { format } from 'date-fns-tz';
import { showOrderInfo } from '../helpers/showOrderInfo';

const commentEmptyValues = [' ', '-', 'нет', '_'];

interface ICreateMonthPicker {
  /**
   * The keyboard to select a month
   */
  keyboard: InlineKeyboard;
  /**
   * The first month date
   */
  firstMonthDate: Date;
  /**
   * The second month date
   */
  secondMonthDate: Date;
}

// Generate a keyboard for the user to select a month
export const createMonthPicker = (): ICreateMonthPicker => {
  const currentDate = getZonedDate();

  /**
   * Calculate the eating day, which is the day after delivery.
   * If it's before 9 AM, the delivery will be today, and the eating day is tomorrow.
   * If it's after 9 AM, the delivery will be tomorrow, and the eating day is the day after tomorrow.
   */
  const deliveryDate = isTodayBeforeTime(currentDate, hourDeadlineDeliveryAccept)
    ? currentDate // Delivery today
    : addDays(currentDate, 1); // Delivery tomorrow
  const eatingDate = addDays(deliveryDate, 1); // Eating day (next day after delivery)
  console.log(eatingDate);

  /**
   * If it's the last day of the month and past 9 AM, skip to the next month.
   * E.g. if today is 31st of January, and it's past 9 AM, skip to February.
   */
  const isLastDayOfMonth = getDate(eatingDate) === getDaysInMonth(eatingDate);
  const shouldSkipCurrentMonth =
    isLastDayOfMonth && !isTodayBeforeTime(eatingDate, hourDeadlineDeliveryAccept);

  const firstMonthDate = shouldSkipCurrentMonth
    ? addMonths(eatingDate, 1) // Skip current month
    : eatingDate;
  const secondMonthDate = addMonths(firstMonthDate, 1);

  const firstMonth = format(firstMonthDate, 'MMMM yyyy', { timeZone: TimeZone });
  const secondMonth = format(secondMonthDate, 'MMMM yyyy', { timeZone: TimeZone });

  const keyboard = new InlineKeyboard()
    .text(firstMonth, 'select_month:first')
    .row()
    .text(secondMonth, 'select_month:second');

  return { keyboard, firstMonthDate, secondMonthDate };
};

// Generate a keyboard to pick a day from a selected month
export const createDayPicker = (selectedMonth: Date): InlineKeyboard => {
  const currentDate = getZonedDate();

  // Calculate the first valid eating day
  const deliveryDate = isTodayBeforeTime(currentDate, hourDeadlineDeliveryAccept)
    ? currentDate // Delivery today, eating tomorrow
    : addDays(currentDate, 1); // Delivery tomorrow, eating the day after tomorrow
  const firstEatingDate = addDays(deliveryDate, 1); // Eating day is the day after delivery

  const daysInMonth = getDaysInMonth(selectedMonth);
  const keyboard = new InlineKeyboard();

  console.log('Current Date:', currentDate);
  console.log('Delivery Date:', deliveryDate);
  console.log('First Eating Date:', firstEatingDate);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = getZonedDate(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day),
    );

    // Skip past dates or skip the delivery day itself
    if (isBefore(dayDate, firstEatingDate)) continue;

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

  // Eating date. This is different from the delivery date. The eating date is the day after delivery.
  const monthEmoji = ctx.emoji`${'calendar'}`;
  const { keyboard: monthKeyboard, firstMonthDate, secondMonthDate } = createMonthPicker();
  await ctx.reply(`***Выберите месяц:*** ${monthEmoji}`, {
    reply_markup: monthKeyboard,
    parse_mode: 'MarkdownV2',
  });
  const monthResponse = await conversation.waitForCallbackQuery(/^select_month:(first|second)$/);
  // Determine which month was selected
  const selectedMonth = monthResponse.match[1] === 'first' ? firstMonthDate : secondMonthDate;

  const dayEmoji = ctx.emoji`${'sun'}`;
  await ctx.reply(`***Выберите дату:*** ${dayEmoji}`, {
    reply_markup: createDayPicker(selectedMonth),
    parse_mode: 'MarkdownV2',
  });
  const dayResponse = await conversation.waitForCallbackQuery(/^select_day:(\d{4}-\d{2}-\d{2})$/);
  createOrderSession.eating_date = dateStringToUtcIso(dayResponse.match[1] ?? '');
  // Calculate the delivery date, which is the day before eating
  createOrderSession.delivery_date = formatISO(
    subDays(parseISO(createOrderSession.eating_date), 1),
  );

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

  const { first_name, last_name, phone, address, duration, comments, eating_date, delivery_date } =
    createOrderSession;

  await addOrder({
    user_id: String(ctx.from?.id ?? ''),
    comments,
    first_name,
    last_name,
    phone,
    address,
    delivery_date,
    eating_date,
    duration,
  });

  await showOrderInfo(ctx, createOrderSession, 'ваш заказ принят!');

  return;
};
