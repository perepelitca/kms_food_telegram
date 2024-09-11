import { session, Bot } from 'grammy';
import { createOrder } from './createOrder';
import { exportOrders } from './exportOrders';
import { conversations, createConversation } from '@grammyjs/conversations';
import type { MyContext } from './types';

/**
 * Initialize all conversations
 * @param bot. The bot to initialize the conversations on
 */
export const initConversations = (bot: Bot<MyContext>) => {
  bot.use(
    session({
      type: 'multi',
      createOrder: {
        initial: () => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
        }),
      },
      changeOrder: {
        initial: () => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
        }),
      },
      cancelOrder: {
        initial: () => ({
          last_name: '',
          phone: '',
        }),
      },
      exportOrders: {},
      conversation: {},
    }),
  );

  bot.use(conversations());
  bot.use(createConversation(createOrder));
  bot.use(createConversation(exportOrders));
}
