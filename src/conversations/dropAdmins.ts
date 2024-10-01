import type { BotContext, BotConversation } from './types';
import { validateAdminAccess } from '../helpers/validateAdminAccess';
import { yesNoPicker } from '../helpers/yesNoPicker';
import { dropAdmins as dropDbAdmins } from '../db';

/**
 * Drop all admins. Only admin users can drop admins.
 */
export const dropAdmins = async (conversation: BotConversation, ctx: BotContext) => {
  const dropAdminsEmoji = ctx.emoji`${'face_with_peeking_eye'}`;
  const shouldDropAdmins = await yesNoPicker(
    `Вы действительно хотите удалить всеx админов? ${dropAdminsEmoji}`,
    conversation,
    ctx,
  );
  if (!shouldDropAdmins) {
    await ctx.reply(ctx.emoji`Уфф! Не будем ничего удалять  ${'heart_hands'}`);
    return;
  }

  const isAdminUser = await validateAdminAccess(conversation, ctx);

  if (!isAdminUser) {
    return;
  }

  await dropDbAdmins();
  await ctx.reply('Все админы удалены!');
  return;
};
