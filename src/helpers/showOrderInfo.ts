import type { BotContext, OrderData } from '../conversations/types';
import { utcToZonedTime } from './datetime';

/**
 * Show order information
 * @param ctx. BotContext
 * @param order. Order data object
 * @param message. Message to show
 */
export const showOrderInfo = async (ctx: BotContext, order: OrderData, message: string) => {
  const { first_name, phone, address, duration, comments, delivery_date, eating_date } = order;

  await ctx.reply(
    `
<b>${first_name},</b> ${message} 🎉
<pre>
Телефон:                ${phone}
Адрес:                  ${address}
На сколько дней:        ${duration}
Когда привезем:         ${utcToZonedTime(delivery_date)}
Дата начала рациона:    ${utcToZonedTime(eating_date)}
Комментарии:            ${comments}
</pre>
`,
    { parse_mode: 'HTML' },
  );
};
