import { session, Bot } from 'grammy';
import { createOrder } from './createOrder';
import { changeOrder } from './changeOrder';
import { exportOrders } from './exportOrders';
import { showOrders } from './showOrders';
import { dropOrders } from './dropOrders';
import { dropAdmins } from './dropAdmins';
import { conversations, createConversation } from '@grammyjs/conversations';
import type { BotContext, OrderData } from './types';
import { FileAdapter } from '@grammyjs/storage-file';

export enum ConversationSession {
  CreateOrder = 'createOrder',
  ChangeOrder = 'changeOrder',
  ShowOrders = 'showOrders',
  ExportOrders = 'exportOrders',
  DropOrders = 'dropOrders',
  DropAdmins = 'dropAdmins',
  Conversation = 'conversation',
}

/**
 * Get the session storage for the given session name
 * @param sessionName. The name of the session to get the storage for
 */
const getSessionStorage = <T>(sessionName: ConversationSession) => {
  return new FileAdapter<T>({
    dirName: `./sessions/${sessionName}`,
  });
};

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
          eating_date: '',
        }),
        storage: getSessionStorage<OrderData>(ConversationSession.CreateOrder),
      },
      [ConversationSession.ChangeOrder]: {
        initial: (): OrderData => ({
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          duration: 0,
          delivery_date: '',
          eating_date: '',
        }),
        storage: getSessionStorage<OrderData>(ConversationSession.ChangeOrder),
      },
      [ConversationSession.ShowOrders]: {},
      [ConversationSession.DropOrders]: {},
      [ConversationSession.DropAdmins]: {},
      [ConversationSession.ExportOrders]: {
        storage: getSessionStorage<never>(ConversationSession.ExportOrders),
      },
      /**
       * To store conversations per session
       * @see https://t.me/grammyjs/268859
       */
      [ConversationSession.Conversation]: {
        storage: getSessionStorage<never>(ConversationSession.Conversation),
      },
    }),
  );

  bot.use(conversations());
  bot.use(createConversation(createOrder));
  bot.use(createConversation(changeOrder));
  bot.use(createConversation(exportOrders));
  bot.use(createConversation(showOrders));
  bot.use(createConversation(dropOrders));
  bot.use(createConversation(dropAdmins));
};
