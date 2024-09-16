import { addOrder } from '../db';
import type { MyConversation, MyContext } from './types';
import { askForPhoneNumber } from '../helpers/phone';
import { InlineKeyboard } from 'grammy';
import { getZonedDate, TimeZone, isTodayBefore9am } from '../helpers/datetime';
import { addMonths, getDaysInMonth, isBefore } from 'date-fns';
import { format } from 'date-fns-tz';

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
    const dayDate = getZonedDate(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day));

    // Skip past dates
    if (isBefore(dayDate, currentDate)) continue;

    // Skip today if it's after 9am
    if (
      format(dayDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
      !isTodayBefore9am(dayDate)
    ) {
      continue;
    }

    const dayLabel = format(dayDate, 'd');
    keyboard.text(dayLabel, `select_day:${format(dayDate, 'dd-MM-yyyy')}`);

    if (day % 7 === 0) {
      keyboard.row(); // Add a new row after 7 days
    }
  }

  return keyboard;
};

export const commentPicker = (): InlineKeyboard =>
  new InlineKeyboard().text('Нет комментариев', 'nocomments');

// Create order conversation where user enters their order details
export const createOrder = async (conversation: MyConversation, ctx: MyContext) => {
  await ctx.reply(ctx.emoji`Начем заказ! ${'handshake_light_skin_tone_no_skin_tone'}`);
  const createOrderSession = conversation.session.createOrder;

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
  const dayResponse = await conversation.waitForCallbackQuery(/^select_day:(\d{2}-\d{2}-\d{4})$/, {
    otherwise: (ctx) =>
      ctx.reply('Выберите дату!', { reply_markup: createDayPicker(selectedMonth) }),
  });
  createOrderSession.delivery_date = dayResponse.match[1] ?? '';

  const firstNameEmoji = ctx.emoji`${'person_raising_hand'}`;
  await ctx.reply(`***Введите ваше имя*** ${firstNameEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: firstName } = await conversation.waitFor(':text');
  createOrderSession.first_name = firstName?.text ?? '';

  const lastNameEmoji = ctx.emoji`${'passport_control'}`;
  await ctx.reply(`***Ваша фамилия*** ${lastNameEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: lastName } = await conversation.waitFor(':text');
  createOrderSession.last_name = lastName?.text ?? '';

  createOrderSession.phone = await askForPhoneNumber(conversation, ctx);

  const addressEmoji = ctx.emoji`${'round_pushpin'}`;
  await ctx.reply(`Ваш адрес ${addressEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: userAddress } = await conversation.waitFor(':text');
  createOrderSession.address = userAddress?.text ?? '';

  const commentEmoji = ctx.emoji`${'scroll'}`;
  await ctx.reply(
    `***Укажите комментарий к заказу \\(аллергии, предпочтения и т\\.д\\.\\)*** ${commentEmoji} \n _Если нет комментариев, просто нажмите кнопку_`,
    {
      reply_markup: commentPicker(),
      parse_mode: 'MarkdownV2',
    },
  );
  const commentResponse = await conversation.waitForCallbackQuery('nocomments');
  console.log(commentResponse.match);
  if (commentResponse.match === 'nocomments') {
    createOrderSession.comments = '';
  } else {
    const { message: userComments } = await conversation.waitFor(':text');
    createOrderSession.comments = userComments?.text;
  }

  const { first_name, last_name, phone, address, duration, comments, delivery_date } =
    createOrderSession;

  if (ctx.chatId) {
    await addOrder({
      user_id: ctx.from?.id ?? ctx.chatId,
      comments,
      first_name,
      last_name,
      phone,
      address,
      delivery_date,
      duration,
    });

    await ctx.reply(
      `
<b>${last_name},</b> ваш заказ принят!,
<pre>
Телефон:          ${phone}
Адрес:            ${address}
На сколько дней:  ${duration}
Дата доставки:    ${delivery_date}
Комментарии:      ${comments}
</pre>
`,
      { parse_mode: 'HTML' },
    );
  }
};
