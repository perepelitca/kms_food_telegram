import type { BotConversation, BotContext } from './types';
import { getOrder } from '../helpers/getOrder';
import { updateOrderDeliveryAddress } from '../db';
import { showOrderInfo } from '../helpers/showOrderInfo';
import { canChangeOrder } from '../helpers/datetime';
import { yesNoPicker } from '../helpers/yesNoPicker';

export const changeOrder = async (conversation: BotConversation, ctx: BotContext) => {
  await getOrder(conversation, ctx);

  if (!conversation.session.showOrders) {
    return;
  }

  const order = conversation.session.showOrders;
  // Clear the showOrders session data
  conversation.session.showOrders = null;

  const shouldChangeAddress = await yesNoPicker(
    'Вы хотите поменять адрес доставки?',
    conversation,
    ctx,
  );
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
