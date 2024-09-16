import type { BotConversation, BotContext } from './types';
import { InlineKeyboard } from 'grammy';
import { ConversationSession } from './index';

// Generate a keyboard for changing the delivery address
export const changeDeliveryAddressPicker = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text('Да ✅', 'change_address:yes')
    .row()
    .text('Нет ❌', 'change_address:no');
};

export const changeOrder = async (conversation: BotConversation, ctx: BotContext) => {
  await ctx.conversation.enter(ConversationSession.ShowOrders);

  if (!conversation.session.showOrders) {
    // await ctx.conversation.exit()
    return;
  }
  // const {address} = conversation.session.showOrders
  // Clear the showOrders session data
  conversation.session.showOrders = null;

  await ctx.reply(`Вы хотите поменять адрес доставки?`, {
    reply_markup: changeDeliveryAddressPicker(),
  });
  const addressResponse = await conversation.waitForCallbackQuery(/^change_address:(yes|no)$/);
  const shouldChangeAddress = addressResponse.match[1] === 'yes';
  const addressEmoji = ctx.emoji`${'round_pushpin'}`;
  console.log(`!!!!!!!!!!!!`, addressEmoji, shouldChangeAddress);
  //
  // return
  //
  // if (!shouldChangeAddress) {
  //   await ctx.reply(`Хорошо! Адрес ${addressEmoji} останется прежним: ***  ***`, {
  //     parse_mode: 'MarkdownV2',
  //   });
  //   // await ctx.conversation.exit()
  //   return
  // }
  //
  // await ctx.reply(`Введите новый адрес доставки ${addressEmoji}`, {
  //   parse_mode: 'MarkdownV2',
  // });
  // const { message: userAddress } = await conversation.waitFor(':text');
  //
  // console.log(`!!!!!!!!!!!!`, userAddress)
};
