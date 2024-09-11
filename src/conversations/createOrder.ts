import { addOrder } from '../db';
import type { MyConversation, MyContext } from './types';

export const createOrder = async (conversation: MyConversation, ctx: MyContext) => {
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
