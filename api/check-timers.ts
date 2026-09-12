const BOT_TOKEN = '8921734925:AAEP8Xt5VggOVOCHmPz9IUsKZnpfwyHFZMI';
const CHAT_ID = '-596427437';
const FIREBASE_DB_URL =
  'https://mom-medicine-timer-768c6-default-rtdb.asia-southeast1.firebasedatabase.app';

export default async function handler(req: any, res: any) {
  try {
    const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
    const timers = (await resTimers.json()) || [];
    const timerList = Array.isArray(timers) ? timers : Object.values(timers);

    const now = Date.now();
    let sentCount = 0;
    let hasUpdates = false;

    for (let i = 0; i < timerList.length; i++) {
      const t: any = timerList[i];

      // Timer is running and target time has passed, but alert has not been sent yet
      if (
        t.status === 'running' &&
        t.targetTimestamp &&
        now >= t.targetTimestamp &&
        !t.alertSent
      ) {
        // Send alert to Telegram group
        const text = `🚨 *TIME FOR MOM'S MEDICINE!* 🚨\n\n💊 *${t.name}*\n${
          t.note ? `📝 _Note: ${t.note}_\n` : ''
        }\nPlease make sure she takes it now!`;

        const replyMarkup = {
          inline_keyboard: [
            [
              {
                text: '✅ Mark as Taken',
                callback_data: `taken_${t.id}`,
              },
              {
                text: '🔁 Redo Countdown',
                callback_data: `redo_${t.id}`,
              },
            ],
          ],
        };

        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: CHAT_ID,
              text,
              parse_mode: 'Markdown',
              reply_markup: replyMarkup,
            }),
          });
          sentCount++;
        } catch (err) {
          console.warn('Failed to send Telegram alert for timer:', t.id, err);
        }

        // Mark as completed and alertSent so it doesn't send repeatedly
        timerList[i] = {
          ...t,
          status: 'completed',
          alertSent: true,
          completedAt: now,
        };
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await fetch(`${FIREBASE_DB_URL}/family_timers.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timerList),
      });
    }

    return res.status(200).json({
      ok: true,
      sentCount,
      totalTimers: timerList.length,
      timestamp: now,
    });
  } catch (error: any) {
    console.warn('Error in check-timers:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
