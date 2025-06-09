from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Ваш URL веб-приложения
WEB_APP_URL = "https://incredible-gumdrop-dd10e7.netlify.app/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Создаем кнопку с web_app
    button = InlineKeyboardButton(
        text="Открыть Web App",
        web_app={"url": WEB_APP_URL}
    )
    keyboard = InlineKeyboardMarkup([[button]])

    # Отправляем сообщение с кнопкой
    await update.message.reply_text(
        "Здраствуйте! Нажмите кнопку ниже:",
        reply_markup=keyboard
    )

if __name__ == '__main__':
    # Замените 'YOUR_BOT_TOKEN' на токен вашего бота
    application = ApplicationBuilder().token("8082201989:AAEOWxVzIEHfwgwIwxKWYlhuo-aJruuIvEs").build()

    application.add_handler(CommandHandler("start", start))

    application.run_polling()