import { session, Bot } from 'grammy';
import { createOrder } from './createOrder';
import { changeOrder } from './changeOrder';
import { exportOrders } from './exportOrders';
import { showOrders } from './showOrders';
import { conversations, createConversation } from '@grammyjs/conversations';
import type { BotContext, OrderData } from './types';

export enum ConversationSession {
  CreateOrder = 'createOrder',
  ChangeOrder = 'changeOrder',
  ShowOrders = 'showOrders',
  ExportOrders = 'exportOrders',
}

/**
 * Initialize all conversations
 * @param bot. The bot to initialize the conversations on
 */
export const initConversations = (bot: Bot<BotContext>) => {
  bot.use(
    session({
      type: 'multi',
      [ConversationSession.CreateOrder]: {
        initial: (): OrderData => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
          delivery_date: '',
        }),
      },
      [ConversationSession.ChangeOrder]: {
        initial: (): OrderData => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
          delivery_date: '',
        }),
      },
      [ConversationSession.ShowOrders]: {},
      /**
       * To store conversations per session
       * @see https://t.me/grammyjs/268859
       */
      conversation: {},
    }),
  );

  bot.use(conversations());
  bot.use(createConversation(createOrder));
  bot.use(createConversation(changeOrder));
  bot.use(createConversation(exportOrders));
  bot.use(createConversation(showOrders));
};
