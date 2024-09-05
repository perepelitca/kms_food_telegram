import { Bot } from "grammy"

// Create a bot object
const bot = new Bot("7096890402:AAFSfFn91KkieRZfk88Osz_FcqHru2c_ris");

// Register listeners to handle messages
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));

// Start the bot (using long polling)
bot.start();
