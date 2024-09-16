import { session, Bot } from 'grammy';
import { createOrder } from './createOrder';
import { changeOrder } from './changeOrder';
import { exportOrders } from './exportOrders';
import { conversations, createConversation } from '@grammyjs/conversations';
import type { MyContext, OrderData, CancelOrderData } from './types';

/**
 * Initialize all conversations
 * @param bot. The bot to initialize the conversations on
 */
export const initConversations = (bot: Bot<MyContext>) => {
  bot.use(
    session({
      type: 'multi',
      createOrder: {
        initial: (): OrderData => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
          delivery_date: '',
        }),
      },
      changeOrder: {
        initial: (): OrderData => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
          delivery_date: '',
        }),
      },
      cancelOrder: {
        initial: (): CancelOrderData => ({
          last_name: '',
          phone: '',
        }),
      },
      conversation: {},
    }),
  );

  bot.use(conversations());
  bot.use(createConversation(createOrder));
  bot.use(createConversation(changeOrder));
  bot.use(createConversation(exportOrders));
};
