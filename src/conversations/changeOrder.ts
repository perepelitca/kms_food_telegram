import { findOrderByNameAndPhone } from '../db';
import type { MyConversation, MyContext } from './types';

export const changeOrder = async (conversation: MyConversation, ctx: MyContext) => {
  await ctx.reply('Давайте поможем Вам изменить заказ!');
  const changeOrderSession = conversation.session.changeOrder;

  await ctx.reply('Введите Вашу фамилию');
  const { message: lastName } = await conversation.waitFor(':text');
  changeOrderSession.last_name = lastName?.text ?? '';

  await ctx.reply('Ваш телефон в формате 9997772233');
  const { message: phone } = await conversation.waitFor(':text');
  changeOrderSession.phone = phone?.text ?? '';

  // const { lastName, phoneNumber } = changeOrderSession;

  // ctx.from?.id;
  const order = await findOrderByNameAndPhone(
    changeOrderSession.last_name,
    changeOrderSession.phone,
  );
  console.log(order);

  // changeOrderSession.duration = await conversation.form.number((ctx) => {
  //   const userDuration = parseInt(ctx?.msg?.text ?? '', 10);
  //   if (userDuration < 1) {
  //     return 'Количество дней должно быть больше 0';
  //   }
  //   return true;
  // });
  //
  // await ctx.reply('Введите ваше имя');
  // const { message: firstName } = await conversation.waitFor(':text');
  // changeOrderSession.first_name = firstName?.text ?? '';
  //
  // await ctx.reply('Ваша фамилия');
  // const { message: lastName } = await conversation.waitFor(':text');
  // changeOrderSession.last_name = lastName?.text ?? '';
  //
  // await ctx.reply('Ваш телефон в формате 9997772233');
  // const { message: phoneNumber } = await conversation.waitFor(':text');
  // changeOrderSession.phone = phoneNumber?.text ?? '';
  //
  // await ctx.reply('Ваш адрес');
  // const { message: userAddress } = await conversation.waitFor(':text');
  // changeOrderSession.address = userAddress?.text ?? '';
  //
  // const { first_name, last_name, phone, address, duration } = changeOrderSession;
  //
  // if (ctx.chatId) {
  //   await addOrder({
  //     user_id: ctx.chatId,
  //     comments: 'comment',
  //     first_name,
  //     last_name,
  //     phone,
  //     address,
  //     delivery_date: '2021-10-10',
  //     duration,
  //   });
  //
  //   await ctx.reply(`${changeOrderSession.first_name}, ваш заказ принят!`);
  // }
};
