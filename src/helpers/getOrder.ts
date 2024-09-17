import type { BotContext, BotConversation } from '../conversations/types';
import { findOrderByUserId } from '../db';
import { showOrderInfo } from './showOrderInfo';

/**
 * Get the last order for the user
 * @param conversation. BotConversation
 * @param ctx. BotContext
 */
export const getOrder = async (conversation: BotConversation, ctx: BotContext): Promise<void> => {
  const userId = ctx.from?.id;
  conversation.session.showOrders = null;

  if (!userId) {
    await ctx.reply(ctx.emoji`Не можем найти заказы... ${'person_shrugging'}`);
    return;
  }

  const lastOrder = await findOrderByUserId(String(userId));

  if (!lastOrder) {
    await ctx.reply(ctx.emoji`Не можем найти заказы... ${'person_shrugging'}`);
    return;
  }

  conversation.session.showOrders = lastOrder;
  await showOrderInfo(ctx, lastOrder, 'вот ваш последний заказ!');
};
