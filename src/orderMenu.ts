import { Menu } from '@grammyjs/menu';
import type { BotContext } from './conversations/types';
import { ConversationSession } from './conversations';

export const orderMenu = new Menu<BotContext>('order-menu')
  .text(
    (ctx) => {
      return (
        `${ctx.emoji`${'new_button'}`}` + ' Новый заказ ' + `${ctx.emoji`${'face_savoring_food'}`}`
      );
    },
    async (ctx) => {
      await ctx.conversation.enter(ConversationSession.CreateOrder, { overwrite: true });
      ctx.menu.close();
    },
  )
  .row()
  .text(
    (ctx) => {
      return 'Изменить заказ ' + `${ctx.emoji`${'pencil'}`}`;
    },
    async (ctx) => {
      ctx.menu.close();
      await ctx.conversation.enter(ConversationSession.ChangeOrder, { overwrite: true });
    },
  )
  .row()
  .text(
    (ctx) => {
      return 'Посмотреть мои заказы ' + `${ctx.emoji`${'nerd_face'}`}`;
    },
    async (ctx) => {
      ctx.menu.close();
      await ctx.conversation.enter(ConversationSession.ShowOrders, { overwrite: true });
    },
  )
  .row();
