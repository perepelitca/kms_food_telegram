import { getOrder } from '../helpers/getOrder';
import type { BotContext, BotConversation } from './types';

/**
 * Show all orders that belong to the user
 */
export const showOrders = async (conversation: BotConversation, ctx: BotContext) => {
  await getOrder(conversation, ctx);
};
