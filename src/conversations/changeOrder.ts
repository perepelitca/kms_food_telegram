import type { BotConversation, BotContext } from './types';
import { InlineKeyboard } from 'grammy';
import { getOrder } from '../helpers/getOrder';
import { updateOrderDeliveryAddress } from '../db';
import { showOrderInfo } from '../helpers/showOrderInfo';
import { canChangeOrder } from '../helpers/datetime';

// Generate a keyboard for changing the delivery address
export const changeDeliveryAddressPicker = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text('Да ✅', 'change_address:yes')
    .row()
    .text('Нет ❌', 'change_address:no');
};

export const changeOrder = async (conversation: BotConversation, ctx: BotContext) => {
  await getOrder(conversation, ctx);

  if (!conversation.session.showOrders) {
    return;
  }

  const order = conversation.session.showOrders;
  // Clear the showOrders session data
  conversation.session.showOrders = null;

  await ctx.reply(`Вы хотите поменять адрес доставки?`, {
    reply_markup: changeDeliveryAddressPicker(),
  });
  const addressResponse = await conversation.waitForCallbackQuery(/^change_address:(yes|no)$/);
  const shouldChangeAddress = addressResponse.match[1] === 'yes';

  if (!shouldChangeAddress) {
    await ctx.reply(ctx.emoji`Хорошо! Оставим адрес доставки без изменений ${'ok_hand'}`);
    return;
  }
  if (!canChangeOrder(order.delivery_date)) {
    await ctx.reply(
      ctx.emoji`Извините, но заказ нельзя уже изменить. \nЗаказы можно изменять до 15:00 в день доставки. ${'smiling_face_with_tear'}`,
    );
    return;
  }

  // Delivery address change
  const addressEmoji = ctx.emoji`${'round_pushpin'}`;
  await ctx.reply(`***На какой адрес меняем?*** ${addressEmoji}`, {
    parse_mode: 'MarkdownV2',
  });
  const { message: userUpdatedAddress } = await conversation.waitFor(':text');
  const updatedOrder = await updateOrderDeliveryAddress(order.id, userUpdatedAddress?.text ?? '');

  if (updatedOrder) {
    await showOrderInfo(ctx, updatedOrder, 'ваш заказ обновлен!');
  }

  return;
};
