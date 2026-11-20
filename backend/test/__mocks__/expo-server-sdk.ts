export class Expo {
  chunkPushNotifications(messages: any[]) {
    return [messages];
  }
  async sendPushNotificationsAsync(_chunks: any[]) {
    return [];
  }
}
