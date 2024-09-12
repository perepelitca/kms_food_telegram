import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import type { DbOrder } from '../db';
import { Context, SessionFlavor } from 'grammy';
import { EmojiFlavor } from '@grammyjs/emoji';

export type OrderData = Pick<
  DbOrder,
  'first_name' | 'last_name' | 'phone' | 'address' | 'duration'
>;
export type CancelOrderData = Pick<DbOrder, 'last_name' | 'phone'>;
interface SessionData {
  /**
   * The data for the order that is currently being created
   */
  createOrder: OrderData;
  /**
   * The data for the order that is currently being changed
   */
  changeOrder: OrderData;
  /**
   * The data for the order that is currently being canceled
   */
  cancelOrder: CancelOrderData;
  /**
   * To store conversations per session
   * @see https://t.me/grammyjs/268859
   */
  conversation: any;
  exportOrders: Record<string, string>;
  favoriteIds: Array<string>;
}

export type MyContext = EmojiFlavor<Context & ConversationFlavor & SessionFlavor<SessionData>>;
export type MyConversation = Conversation<MyContext>;
