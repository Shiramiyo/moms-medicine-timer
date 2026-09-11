const BOT_TOKEN = '8921734925:AAEP8Xt5VggOVOCHmPz9IUsKZnpfwyHFZMI';
const FIREBASE_DB_URL =
  'https://mom-medicine-timer-768c6-default-rtdb.asia-southeast1.firebasedatabase.app';

async function sendTelegram(chatId: string | number, text: string, replyMarkup?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Telegram webhook active' });
  }

  try {
    const update = req.body;

    // 1. Handle Inline Button Clicks (e.g. Mark as Taken / Snooze)
    if (update.callback_query) {
      const cq = update.callback_query;
      const data: string = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const userName = cq.from?.first_name || 'Family member';

      if (data.startsWith('taken_')) {
        const timerId = data.replace('taken_', '');

        // Fetch current timers
        const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
        const timers = (await resTimers.json()) || [];
        const timerList = Array.isArray(timers) ? timers : Object.values(timers);

        const timerIndex = timerList.findIndex((t: any) => t.id === timerId);
        if (timerIndex !== -1) {
          const timer: any = timerList[timerIndex];

          // Record to history
          const logEntry = {
            id: `log-${Date.now()}`,
            timerId: timer.id,
            name: timer.name,
            note: timer.note,
            category: timer.category,
            takenAt: Date.now(),
            takenBy: userName,
          };

          // Fetch current history
          const resHist = await fetch(`${FIREBASE_DB_URL}/family_history.json`);
          const history = (await resHist.json()) || [];
          const historyList = Array.isArray(history) ? history : Object.values(history);
          historyList.unshift(logEntry);

          await fetch(`${FIREBASE_DB_URL}/family_history.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyList),
          });

          // Handle repeat or reset
          if (timer.repeatEveryHours && timer.repeatEveryHours > 0) {
            const repeatSec = timer.repeatEveryHours * 3600;
            timerList[timerIndex] = {
              ...timer,
              durationSeconds: repeatSec,
              status: 'running',
              targetTimestamp: Date.now() + repeatSec * 1000,
              pausedRemainingSeconds: repeatSec,
            };
          } else {
            timerList[timerIndex] = {
              ...timer,
              status: 'paused',
              targetTimestamp: null,
              pausedRemainingSeconds: timer.durationSeconds,
            };
          }

          await fetch(`${FIREBASE_DB_URL}/family_timers.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timerList),
          });

          await answerCallback(cq.id, 'Marked as taken!');
          await sendTelegram(
            chatId,
            `✅ *${timer.name}* marked as taken by *${userName}*! ❤️`
          );
        } else {
          await answerCallback(cq.id, 'Timer not found or already completed');
        }
      } else if (data.startsWith('redo_')) {
        const timerId = data.replace('redo_', '');

        const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
        const timers = (await resTimers.json()) || [];
        const timerList = Array.isArray(timers) ? timers : Object.values(timers);

        const timerIndex = timerList.findIndex((t: any) => t.id === timerId);
        if (timerIndex !== -1) {
          const timer: any = timerList[timerIndex];
          const restartSec = timer.durationSeconds || 3600;
          timerList[timerIndex] = {
            ...timer,
            status: 'running',
            targetTimestamp: Date.now() + restartSec * 1000,
            pausedRemainingSeconds: restartSec,
          };

          await fetch(`${FIREBASE_DB_URL}/family_timers.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timerList),
          });

          const durHuman =
            restartSec >= 3600
              ? `${Math.floor(restartSec / 3600)}h`
              : `${Math.floor(restartSec / 60)}m`;
          await answerCallback(cq.id, 'Countdown restarted!');
          await sendTelegram(
            chatId,
            `🔁 *${timer.name}* countdown restarted (${durHuman}) by *${userName}*! It is now running automatically.`
          );
        }
      } else if (data.startsWith('snooze_')) {
        const timerId = data.replace('snooze_', '');

        const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
        const timers = (await resTimers.json()) || [];
        const timerList = Array.isArray(timers) ? timers : Object.values(timers);

        const timerIndex = timerList.findIndex((t: any) => t.id === timerId);
        if (timerIndex !== -1) {
          const timer: any = timerList[timerIndex];
          const extraSeconds = 600; // 10 mins
          timerList[timerIndex] = {
            ...timer,
            status: 'running',
            targetTimestamp: Date.now() + extraSeconds * 1000,
            pausedRemainingSeconds: extraSeconds,
          };

          await fetch(`${FIREBASE_DB_URL}/family_timers.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timerList),
          });

          await answerCallback(cq.id, 'Snoozed for 10 minutes!');
          await sendTelegram(
            chatId,
            `⏰ *${timer.name}* snoozed for 10 minutes by *${userName}*.`
          );
        }
      }

      return res.status(200).json({ ok: true });
    }

    // 2. Handle Text Commands
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const helpMsg =
          `👋 *Welcome to Mom's Medicine Bot!*\n\n` +
          `I help the family make sure mom never misses her medication.\n\n` +
          `*Available Commands:*\n` +
          `• \`/status\` - View all active countdowns\n` +
          `• \`/history\` - View doses taken today\n` +
          `• \`/add <name> <time>\` - Add a new timer\n` +
          `  _Example:_ \`/add Blood Pressure 4h\`\n` +
          `  _Example:_ \`/add Eye Drops 30m\`\n\n` +
          `When a timer finishes, I will send an alert right here with buttons to mark it as taken!`;

        await sendTelegram(chatId, helpMsg);
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith('/status')) {
        const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
        const timers = (await resTimers.json()) || [];
        const timerList = Array.isArray(timers) ? timers : Object.values(timers);

        if (timerList.length === 0) {
          await sendTelegram(chatId, `ℹ️ No active medication countdowns right now.`);
          return res.status(200).json({ ok: true });
        }

        let statusText = `📋 *Mom's Medication Timers:*\n\n`;
        const now = Date.now();

        timerList.forEach((t: any) => {
          let timeStr = '';
          if (t.status === 'completed' || (t.targetTimestamp && now >= t.targetTimestamp)) {
            timeStr = '🚨 *DUE NOW!*';
          } else if (t.status === 'paused') {
            timeStr = '⏸ Paused';
          } else if (t.targetTimestamp) {
            const sec = Math.max(0, Math.ceil((t.targetTimestamp - now) / 1000));
            const hrs = Math.floor(sec / 3600);
            const mins = Math.floor((sec % 3600) / 60);
            timeStr = `⏳ \`${hrs}h ${mins}m remaining\``;
          }
          statusText += `• *${t.name}*: ${timeStr}\n`;
        });

        await sendTelegram(chatId, statusText);
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith('/history')) {
        const resHist = await fetch(`${FIREBASE_DB_URL}/family_history.json`);
        const history = (await resHist.json()) || [];
        const historyList = Array.isArray(history) ? history : Object.values(history);

        if (historyList.length === 0) {
          await sendTelegram(chatId, `📖 No doses logged yet.`);
          return res.status(200).json({ ok: true });
        }

        let histText = `📖 *Recent Taken Doses:*\n\n`;
        historyList.slice(0, 5).forEach((h: any) => {
          const date = new Date(h.takenAt).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          });
          histText += `• *${h.name}* — ${date} ${h.takenBy ? `(by ${h.takenBy})` : ''}\n`;
        });

        await sendTelegram(chatId, histText);
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith('/add')) {
        const parts = text.replace('/add', '').trim().split(' ');
        if (parts.length < 2) {
          await sendTelegram(
            chatId,
            `⚠️ Please use format: \`/add <name> <time>\`\nExample: \`/add Blood Pressure 4h\``
          );
          return res.status(200).json({ ok: true });
        }

        const durationStr = parts.pop() || '';
        const name = parts.join(' ');

        let durationMinutes = 60;
        if (durationStr.endsWith('h')) {
          durationMinutes = parseFloat(durationStr.replace('h', '')) * 60;
        } else if (durationStr.endsWith('m')) {
          durationMinutes = parseFloat(durationStr.replace('m', ''));
        }

        const durationSeconds = Math.max(durationMinutes * 60, 60);
        const targetTimestamp = Date.now() + durationSeconds * 1000;
        const newTimer = {
          id: `timer-${Date.now()}`,
          name,
          category: 'pill',
          durationSeconds,
          status: 'running',
          targetTimestamp,
          pausedRemainingSeconds: durationSeconds,
          color: '#6366F1',
          createdAt: Date.now(),
        };

        const resTimers = await fetch(`${FIREBASE_DB_URL}/family_timers.json`);
        const timers = (await resTimers.json()) || [];
        const timerList = Array.isArray(timers) ? timers : Object.values(timers);
        timerList.unshift(newTimer);

        await fetch(`${FIREBASE_DB_URL}/family_timers.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timerList),
        });

        await sendTelegram(
          chatId,
          `✅ Added *${name}* countdown for *${durationStr}*!\nEveryone's app screen has been updated.`
        );
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.warn('Webhook error:', error);
    return res.status(200).json({ ok: false });
  }
}
