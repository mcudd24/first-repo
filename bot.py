import asyncio
import os
import logging
import anthropic
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

claude = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Per-chat conversation history
chat_histories: dict[int, list[dict]] = {}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    chat_histories[chat_id] = []
    await update.message.reply_text("Hi! I'm powered by Claude. Ask me anything. Use /clear to reset the conversation.")


async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_histories[update.effective_chat.id] = []
    await update.message.reply_text("Conversation cleared.")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    user_text = update.message.text

    history = chat_histories.setdefault(chat_id, [])
    history.append({"role": "user", "content": user_text})

    await update.message.chat.send_action("typing")

    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=history,
    )

    reply = response.content[0].text
    history.append({"role": "assistant", "content": reply})

    await update.message.reply_text(reply)


def main() -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN environment variable is not set")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("clear", clear))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    asyncio.set_event_loop(asyncio.new_event_loop())
    logger.info("Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
