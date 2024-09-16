import type { BotContext, BotConversation } from './types';
import { findOrderByUserId } from '../db';

/**
 * Show all orders that belong to the user
 */
export const showOrders = async (conversation: BotConversation, ctx: BotContext) => {
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
  const { last_name, phone, address, duration, comments, delivery_date } = lastOrder;

  await ctx.reply(
    `
<b>${last_name},</b> вот ваш последний заказ! 🎉
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

  return;
};
