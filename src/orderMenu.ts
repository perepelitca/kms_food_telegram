import { Menu } from '@grammyjs/menu';
import type { MyContext } from './conversations/types';

export const orderMenu = new Menu<MyContext>('order-menu')
  .text(
    (ctx) => {
      return (
        `${ctx.emoji`${'new_button'}`}` + ' Новый заказ ' + `${ctx.emoji`${'face_savoring_food'}`}`
      );
    },
    async (ctx) => {
      await ctx.conversation.enter('createOrder');
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
     await ctx.conversation.enter('changeOrder')
    },
  )
  .row()
  .text(
    (ctx) => {
      return 'Посмотреть мои заказы ' + `${ctx.emoji`${'nerd_face'}`}`;
    },
    (ctx) => ctx.reply(ctx.emoji`${"soon_arrow"} Coming soon! ${"soon_arrow"}`)
  )
  .row()
