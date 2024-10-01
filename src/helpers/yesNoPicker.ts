import type { BotConversation, BotContext } from '../conversations/types';
import { InlineKeyboard } from 'grammy';

// Generate a keyboard for the user to select Yes or No
const yesNoKeyboardPicker = (): InlineKeyboard => {
  return new InlineKeyboard().text('Да ✅', 'answer:yes').row().text('Нет ❌', 'answer:no');
};

/**
 * Ask the user to select Yes or No
 * @param prompt. The message to ask the user
 * @param conversation. BotConversation
 * @param ctx. BotContext
 */
export const yesNoPicker = async (
  prompt: string,
  conversation: BotConversation,
  ctx: BotContext,
): Promise<boolean> => {
  await ctx.reply(prompt, {
    reply_markup: yesNoKeyboardPicker(),
  });
  const yesNoKeyboardResponse = await conversation.waitForCallbackQuery(/^answer:(yes|no)$/);
  return yesNoKeyboardResponse.match[1] === 'yes';
};
