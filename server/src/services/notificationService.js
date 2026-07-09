const { Expo } = require('expo-server-sdk');

class NotificationService {
  constructor(db) {
    this.expo = new Expo();
    this.db = db;
  }

  async sendNewsNotification(ticker, newsItem) {
    const tokens = this.db.getAllPushTokens();
    if (tokens.length === 0) return;

    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title: `📰 ${ticker} – Nová zpráva`,
        body: newsItem.title.substring(0, 150),
        data: {
          type: 'news',
          ticker,
          newsId: newsItem.id,
          url: newsItem.url,
        },
        channelId: 'stock-news',
        priority: newsItem.is_breaking ? 'high' : 'default',
      }));

    await this._sendBatch(messages);
  }

  async sendInsiderNotification(ticker, transaction) {
    const tokens = this.db.getAllPushTokens();
    if (tokens.length === 0) return;

    const emoji = transaction.transaction_type === 'buy' ? '🟢' : '🔴';
    const action = transaction.transaction_type === 'buy' ? 'nakoupil' : 'prodal';
    const value = transaction.total_value
      ? ` za $${(transaction.total_value / 1000).toFixed(0)}K`
      : '';

    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title: `${emoji} ${ticker} – Insider ${action}`,
        body: `${transaction.person_name} (${transaction.person_title || 'vedení'}) ${action}${value}`,
        data: {
          type: 'insider',
          ticker,
          transactionId: transaction.id,
        },
        channelId: 'insider-trades',
        priority: 'high',
      }));

    await this._sendBatch(messages);
  }

  async sendBreakingNotification(ticker, title, body) {
    const tokens = this.db.getAllPushTokens();
    if (tokens.length === 0) return;

    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title: `🔴 BREAKING: ${ticker}`,
        body: title.substring(0, 200),
        data: { type: 'breaking', ticker },
        channelId: 'breaking-news',
        priority: 'high',
      }));

    await this._sendBatch(messages);
  }

  async sendRefreshSummary(newCount, tickers) {
    if (newCount === 0) return;

    const tokens = this.db.getAllPushTokens();
    if (tokens.length === 0) return;

    const tickerList = [...new Set(tickers)].slice(0, 5).join(', ');
    const more = tickers.length > 5 ? ` a ${tickers.length - 5} dalších` : '';

    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title: `📈 ${newCount} nových zpráv`,
        body: `Novinky u: ${tickerList}${more}`,
        data: { type: 'summary', count: newCount },
        channelId: 'stock-news',
        priority: 'default',
      }));

    await this._sendBatch(messages);
  }

  async _sendBatch(messages) {
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        // Check for errors and remove invalid tokens
        for (let i = 0; i < tickets.length; i++) {
          if (tickets[i].status === 'error') {
            const details = tickets[i].details;
            if (details && details.error === 'DeviceNotRegistered') {
              console.log(`[Notifications] Removing invalid token: ${chunk[i].to}`);
              this.db.removePushToken(chunk[i].to);
            }
            console.error(`[Notifications] Error:`, tickets[i].message);
          }
        }
      } catch (err) {
        console.error('[Notifications] Send error:', err.message);
      }
    }
  }
}

module.exports = NotificationService;
