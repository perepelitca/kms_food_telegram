import { addAdmin, isAdmin } from '../db';
import bcrypt from 'bcrypt';
import type { BotContext, BotConversation } from '../conversations/types';

/**
 * Validate if the user has admin access.
 * @param conversation. The conversation to use for the validation
 * @param ctx. The context to use for the validation
 */
export const validateAdminAccess = async (
  conversation: BotConversation,
  ctx: BotContext,
): Promise<boolean> => {
  const userId = ctx.from?.id;
  /**
   * Golden Rule 1: All Side-effects Must Be Wrapped
   * @see https://grammy.dev/plugins/conversations#rule-i-all-side-effects-must-be-wrapped
   */
  const isAdminUser = userId && (await conversation.external(() => isAdmin(String(userId))));

  if (isAdminUser) {
    return true;
  }

  await ctx.reply(ctx.emoji`${'locked'} Введите пароль администратора`);
  const { message: password, msgId } = await conversation.waitFor(':text');
  /**
   * Golden Rule 1: All Side-effects Must Be Wrapped
   * @see https://grammy.dev/plugins/conversations#rule-i-all-side-effects-must-be-wrapped
   */
  const isCorrectPassword = await conversation.external(() =>
    bcrypt.compare(password?.text ?? '', process.env.PASSWORD_HASH as string),
  );

  if (isCorrectPassword) {
    /** Delete the password message after receiving it.
     * This is to prevent the password from being stored in the chat
     */
    if (ctx.chat?.id) {
      await ctx.api.deleteMessage(ctx.chat.id, msgId);
    }

    /**
     * Add user to admin list if password is correct so that they don't have to enter a password again
     */
    if (userId) {
      await addAdmin(String(userId));
    }
  } else {
    await ctx.reply(ctx.emoji`${'no_entry'} Access denied! ${'no_entry'}`);
    // return;
  }

  return isCorrectPassword;
};
