import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import type { DbOrder } from '../db';
import { Context, SessionFlavor } from 'grammy';
import { EmojiFlavor } from '@grammyjs/emoji';
import { ConversationSession } from './index';

export type OrderData = Pick<
  DbOrder,
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'address'
  | 'duration'
  | 'delivery_date'
  | 'eating_date'
  | 'comments'
>;

export interface SessionData {
  /**
   * The data for the order that is currently being created
   */
  [ConversationSession.CreateOrder]: OrderData;

  /**
   * The data for the order that is currently being changed
   */
  [ConversationSession.ChangeOrder]: OrderData;

  /**
   * The data for the order that is currently being shown
   */
  [ConversationSession.ShowOrders]: DbOrder | null;

  /**
   * The data for the order that is currently being shown
   */
  [ConversationSession.ExportOrders]: never;

  /**
   * Service session to store the conversation for dropping orders and admins
   */
  [ConversationSession.DropOrders]: never;
  [ConversationSession.DropAdmins]: never;

  /**
   * To store conversations per session
   * @see https://t.me/grammyjs/268859
   */
  conversation: never;
}

export type BotContext = EmojiFlavor<Context & ConversationFlavor & SessionFlavor<SessionData>>;
export type BotConversation = Conversation<BotContext>;
