import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";

const botToken = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

if (!botToken) {
  throw new Error("BOT_TOKEN is required");
}
if (!webAppUrl) {
  throw new Error("WEB_APP_URL is required");
}

const bot = new Bot(botToken);

const appKeyboard = new InlineKeyboard().webApp("Открыть трекер", webAppUrl);

bot.command("start", async (ctx) => {
  await ctx.reply("Откройте трекер привычек", {
    reply_markup: appKeyboard,
  });
});

bot.command("app", async (ctx) => {
  await ctx.reply("Мини-приложение доступно по кнопке ниже:", {
    reply_markup: appKeyboard,
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    [
      "Команды:",
      "/start - открыть кнопку мини-приложения",
      "/app - повторно отправить кнопку",
      "",
      "Можно также настроить Menu Button через BotFather (/setmenubutton).",
    ].join("\n"),
  );
});

bot.catch((error) => {
  console.error("Bot error", error.error);
});

await bot.api.setMyCommands([
  { command: "start", description: "Открыть трекер привычек" },
  { command: "app", description: "Показать кнопку мини-приложения" },
  { command: "help", description: "Помощь" },
]);

console.log("Bot is running in long-polling mode");
await bot.start();
