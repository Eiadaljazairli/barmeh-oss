import { io, Socket } from 'socket.io-client';
import * as SecureStore from '../utils/storage';
import Constants from 'expo-constants';

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000';

const SOCKET_URL = API_URL.replace('/v1', '');

class SocketService {
  private socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;

    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  sendTyping(recipientId: string, listingId?: string) {
    this.socket?.emit('typing', { recipientId, listingId });
  }

  stopTyping(recipientId: string, listingId?: string) {
    this.socket?.emit('stop_typing', { recipientId, listingId });
  }

  markRead(chatId: string) {
    this.socket?.emit('mark_read', { chatId });
  }
}

export const socketService = new SocketService();
