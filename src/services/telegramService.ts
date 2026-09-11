export const TELEGRAM_CONFIG = {
  botToken: '8921734925:AAEP8Xt5VggOVOCHmPz9IUsKZnpfwyHFZMI',
  chatId: '-596427437',
};

export async function sendTelegramMessage(
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
    const payload: any = {
      chat_id: TELEGRAM_CONFIG.chatId,
      text,
      parse_mode: 'Markdown',
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.warn('Telegram message failed to send:', error);
    return false;
  }
}

// Send high-priority alert when a medication countdown finishes
export async function sendMedicationDueAlert(
  name: string,
  note?: string,
  timerId?: string
): Promise<boolean> {
  const text = `🚨 *TIME FOR MOM'S MEDICINE!* 🚨\n\n💊 *${name}*\n${
    note ? `📝 _Note: ${note}_\n` : ''
  }\nPlease make sure she takes it now!`;

  const replyMarkup = timerId
    ? {
        inline_keyboard: [
          [
            {
              text: '✅ Mark as Taken',
              callback_data: `taken_${timerId}`,
            },
            {
              text: '🔁 Redo Countdown',
              callback_data: `redo_${timerId}`,
            },
          ],
        ],
      }
    : undefined;

  return sendTelegramMessage(text, replyMarkup);
}

// Announce to the family group when a new timer is started
export async function sendNewTimerAnnounce(
  name: string,
  durationStr: string,
  note?: string
): Promise<boolean> {
  const text = `⏳ *New Countdown Started*\n\n💊 *${name}* (${durationStr})\n${
    note ? `📝 _Note: ${note}_\n` : ''
  }The family will be notified when it's time!`;

  return sendTelegramMessage(text);
}

// Announce to the group when someone marks a dose as taken
export async function sendTakenAnnounce(
  name: string,
  timeStr: string
): Promise<boolean> {
  const text = `✅ *Medicine Taken!*\n\n💊 *${name}* was marked as taken at *${timeStr}*.\nGood job, family! ❤️`;

  return sendTelegramMessage(text);
}
