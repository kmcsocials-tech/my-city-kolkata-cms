'use strict';

const { Expo } = require('expo-server-sdk');

/**
 * push-token service
 */

module.exports = ({ strapi }) => ({
  /**
   * Send push notification to all registered devices
   * @param {Object} notification - { title: string, body: string, data?: object, imageUrl?: string }
   * @returns {Promise<Object>} - { success: boolean, sent: number, failed: number }
   */
  async sendToAll(notification) {
    const { title, body, data = {}, imageUrl } = notification;

    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    try {
      // Get all valid tokens from database
      // @ts-ignore - strapi global is available in Strapi services
      const tokens = await strapi.db.query('api::push-token.push-token').findMany({
        select: ['token'],
      });

      if (tokens.length === 0) {
        return { success: true, sent: 0, failed: 0, message: 'No tokens registered' };
      }

      const expo = new Expo();
      const messages = [];

      // Prepare messages for all tokens
      for (const tokenEntry of tokens) {
        // Check if token is valid Expo push token
        if (Expo.isExpoPushToken(tokenEntry.token)) {
          const message = {
            to: tokenEntry.token,
            sound: 'default',
            title,
            body,
            data: {
              ...data,
              ...(imageUrl && { imageUrl }),
            },
            priority: 'high',
            channelId: 'default', // Android notification channel
          };

          // Add image attachment for iOS rich notifications
          if (imageUrl) {
            message.attachments = [
              {
                url: imageUrl,
                thumbnailUrl: imageUrl,
              },
            ];
          }

          messages.push(message);
        } else {
          strapi.log.warn(`Invalid Expo push token: ${tokenEntry.token}`);
        }
      }

      if (messages.length === 0) {
        return { success: true, sent: 0, failed: 0, message: 'No valid tokens' };
      }

      // Send notifications in chunks (Expo allows max 100 at a time)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      let sent = 0;
      let failed = 0;

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          
          // Count successful and failed
          ticketChunk.forEach(ticket => {
            if (ticket.status === 'ok') {
              sent++;
            } else {
              failed++;
            }
          });
        } catch (error) {
          strapi.log.error('Error sending notification chunk:', error);
          failed += chunk.length;
        }
      }

      return {
        success: true,
        sent,
        failed,
        total: messages.length,
        tickets,
      };
    } catch (error) {
      strapi.log.error('Error sending push notifications:', error);
      throw error;
    }
  },

  /**
   * Send push notification to specific tokens
   * @param {string[]} tokens - Array of Expo push tokens
   * @param {Object} notification - { title: string, body: string, data?: object, imageUrl?: string }
   */
  async sendToTokens(tokens, notification) {
    const { title, body, data = {}, imageUrl } = notification;

    if (!Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('Tokens array is required');
    }

    const expo = new Expo();
    const messages = tokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => {
        const message = {
          to: token,
          sound: 'default',
          title,
          body,
          data: {
            ...data,
            ...(imageUrl && { imageUrl }),
          },
          priority: 'high',
          channelId: 'default',
        };

        // Add image attachment for iOS rich notifications
        if (imageUrl) {
          message.attachments = [
            {
              url: imageUrl,
              thumbnailUrl: imageUrl,
            },
          ];
        }

        return message;
      });

    if (messages.length === 0) {
      return { success: true, sent: 0, failed: 0, message: 'No valid tokens' };
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    let sent = 0;
    let failed = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        
        ticketChunk.forEach(ticket => {
          if (ticket.status === 'ok') {
            sent++;
          } else {
            failed++;
          }
        });
      } catch (error) {
        strapi.log.error('Error sending notification chunk:', error);
        failed += chunk.length;
      }
    }

    return { success: true, sent, failed, total: messages.length, tickets };
  },
});
