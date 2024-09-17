import { isAdmin, addAdmin } from '../db';
import { InputFile } from 'grammy';
import type { BotConversation, BotContext } from './types';
import { generateExcelFromQuery } from '../helpers/export';
import fs from 'fs';
import bcrypt from 'bcrypt';

/**
 * Export orders to Excel file. Only admin users can export orders.
 */
export const exportOrders = async (conversation: BotConversation, ctx: BotContext) => {
  const userId = ctx.from?.id;
  const isAdminUser = userId && (await isAdmin(String(userId)));

  if (!isAdminUser) {
    await ctx.reply(ctx.emoji`${'locked'} Введите пароль администратора`);
    const { message: password, msgId } = await conversation.waitFor(':text', {});
    const match = await bcrypt.compare(password?.text ?? '', process.env.PASSWORD_HASH as string);

    if (!match) {
      await ctx.reply(ctx.emoji`${'no_entry'} Access denied! ${'no_entry'}`);
      return;
    } else if (userId) {
      /** Delete the password message after receiving it.
       * This is to prevent the password from being stored in the chat
       */
      await ctx.api.deleteMessage(ctx.chat?.id as number, msgId);
      /**
       * Add user to admin list if password is correct so that they don't have to enter a password again
       */
      await addAdmin(String(userId));
    }
  }

  await ctx.reply(ctx.emoji`${'check_mark_button'} Loading orders...`);
  const filename = 'exported_messages.xlsx';
  // Define the file path where the Excel file will be saved
  const filePath = `./${filename}`;

  try {
    // Generate the Excel file
    await generateExcelFromQuery(filePath);

    // Create a Readable stream from the file
    const fileStream = fs.createReadStream(filePath);
    await ctx.replyWithDocument(new InputFile(fileStream, filename));

    // Delete the file after sending
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('File does not exist or failed to send:', err);
    await ctx.reply(ctx.emoji`Упс, что-то пошло не так, попробуйте позже ${'thinking_face'}`);
  }

  return;
};
