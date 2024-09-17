import type { BotContext, BotConversation } from '../conversations/types';

/**
 * Regular expression to validate phone numbers.
 */
const phoneRegex = /^(\+?7|8)?9\d{9}$/;

/**
 * Check if the phone number is valid
 * @param phoneNumber. Phone number to check
 * @returns boolean indicating if the phone number is valid
 */
const isPhoneNumber = (phoneNumber: string | undefined): boolean => {
  return Boolean(phoneNumber && phoneRegex.test(phoneNumber));
};

/**
 * Ask the user for their phone number.
 * @param conversation. The conversation object
 * @param ctx. The context object
 * @returns Promise with the phone number
 */
export const askForPhoneNumber = async (
  conversation: BotConversation,
  ctx: BotContext,
): Promise<string> => {
  let phoneNumber: string;
  const phoneEmoji = ctx.emoji`${'mobile_phone'}`;

  do {
    await ctx.reply(`***Ваш телефон в формате \\+79957772233*** ${phoneEmoji}`, {
      parse_mode: 'MarkdownV2',
    });
    const { message } = await conversation.waitFor(':text');
    phoneNumber = message?.text?.trim() ?? '';

    if (!isPhoneNumber(phoneNumber)) {
      await ctx.reply('Неверный формат телефона. Пожалуйста, введите правильный телефон.');
    }
  } while (!isPhoneNumber(phoneNumber));

  return Promise.resolve(phoneNumber);
};
