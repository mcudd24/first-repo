import asyncio
import os
import logging
from openai import OpenAI
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

DEFAULT_MODEL = "anthropic/claude-sonnet-4-5"

client = OpenAI(
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# Per-chat state: history and active model
chat_histories: dict[int, list[dict]] = {}
chat_models: dict[int, str] = {}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    chat_histories[chat_id] = []
    chat_models[chat_id] = DEFAULT_MODEL
    await update.message.reply_text(
        f"Hi! I'm connected via OpenRouter using {DEFAULT_MODEL}.\n\n"
        "Commands:\n"
        "/model <model-id> — switch model\n"
        "/model — show current model\n"
        "/clear — reset conversation"
    )


async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_histories[update.effective_chat.id] = []
    await update.message.reply_text("Conversation cleared.")


async def model_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    if context.args:
        new_model = context.args[0]
        chat_models[chat_id] = new_model
        chat_histories[chat_id] = []
        await update.message.reply_text(f"Switched to {new_model}. Conversation cleared.")
    else:
        current = chat_models.get(chat_id, DEFAULT_MODEL)
        await update.message.reply_text(
            f"Current model: {current}\n\n"
            "Popular options:\n"
            "anthropic/claude-sonnet-4-5\n"
            "anthropic/claude-opus-4-5\n"
            "x-ai/grok-3\n"
            "openai/gpt-4o\n"
            "google/gemini-2.0-flash-001"
        )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    user_text = update.message.text

    history = chat_histories.setdefault(chat_id, [])
    model = chat_models.get(chat_id, DEFAULT_MODEL)
    history.append({"role": "user", "content": user_text})

    await update.message.chat.send_action("typing")

    response = client.chat.completions.create(
        model=model,
        messages=history,
        max_tokens=1024,
    )

    reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": reply})

    await update.message.reply_text(reply)


def main() -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN environment variable is not set")
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("clear", clear))
    app.add_handler(CommandHandler("model", model_cmd))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    asyncio.set_event_loop(asyncio.new_event_loop())
    logger.info("Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
