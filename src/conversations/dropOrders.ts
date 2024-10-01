import type { BotContext, BotConversation } from './types';
import { validateAdminAccess } from '../helpers/validateAdminAccess';
import { yesNoPicker } from '../helpers/yesNoPicker';
import { dropOrders as dropDbOrders } from '../db';

/**
 * Drop all orders. Only admin users can drop orders.
 */
export const dropOrders = async (conversation: BotConversation, ctx: BotContext) => {
  const dropOrdersEmoji = ctx.emoji`${'face_with_peeking_eye'}`;
  const shouldDropOrders = await yesNoPicker(
    `Вы действительно хотите удалить все заказы? ${dropOrdersEmoji}`,
    conversation,
    ctx,
  );
  if (!shouldDropOrders) {
    await ctx.reply(ctx.emoji`Уфф! Не будем ничего удалять  ${'heart_hands'}`);
    return;
  }

  const isAdminUser = await validateAdminAccess(conversation, ctx);

  if (!isAdminUser) {
    return;
  }

  await dropDbOrders();
  await ctx.reply('Все заказы удалены!');
  return;
};
