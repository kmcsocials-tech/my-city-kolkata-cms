'use strict';

/**
 * push-token controller
 */

module.exports = {
  /**
   * Register or update a push token
   * POST /api/push-token
   * Body: { token: string, platform: 'android' | 'ios', timestamp: string }
   */
  async register(ctx) {
    const { token, platform, timestamp } = ctx.request.body;

    // Validate input
    if (!token) {
      return ctx.badRequest('Token is required');
    }

    if (!platform || !['android', 'ios'].includes(platform)) {
      return ctx.badRequest('Platform must be "android" or "ios"');
    }

    try {
      // Check if token already exists
      // @ts-ignore - strapi global is available in Strapi controllers
      const existingToken = await strapi.db.query('api::push-token.push-token').findOne({
        where: { token },
      });

      if (existingToken) {
        // Update existing token (user reinstalled app or token refreshed)
        await strapi.db.query('api::push-token.push-token').update({
          where: { id: existingToken.id },
          data: {
            platform,
            updatedAt: timestamp || new Date().toISOString(),
          },
        });
        return ctx.send({ 
          success: true, 
          message: 'Token updated',
          id: existingToken.id 
        });
      } else {
        // Create new token entry
        const newToken = await strapi.db.query('api::push-token.push-token').create({
          data: {
            token,
            platform,
            createdAt: timestamp || new Date().toISOString(),
            updatedAt: timestamp || new Date().toISOString(),
          },
        });
        return ctx.send({ 
          success: true, 
          message: 'Token registered',
          id: newToken.id 
        });
      }
    } catch (error) {
      strapi.log.error('Error registering push token:', error);
      return ctx.internalServerError('Failed to register token');
    }
  },

  /**
   * Get all registered push tokens
   * GET /api/push-token
   */
  async findAll(ctx) {
    try {
      // @ts-ignore - strapi global is available in Strapi controllers
      const tokens = await strapi.db.query('api::push-token.push-token').findMany({
        select: ['id', 'token', 'platform', 'createdAt', 'updatedAt'],
      });
      return ctx.send({ success: true, data: tokens, count: tokens.length });
    } catch (error) {
      strapi.log.error('Error fetching push tokens:', error);
      return ctx.internalServerError('Failed to fetch tokens');
    }
  },

  /**
   * Delete a push token (when user uninstalls app)
   * DELETE /api/push-token/:id
   */
  async delete(ctx) {
    const { id } = ctx.params;
    try {
      // @ts-ignore - strapi global is available in Strapi controllers
      await strapi.db.query('api::push-token.push-token').delete({
        where: { id },
      });
      return ctx.send({ success: true, message: 'Token deleted' });
    } catch (error) {
      strapi.log.error('Error deleting push token:', error);
      return ctx.internalServerError('Failed to delete token');
    }
  },

  /**
   * Send notification to all registered devices
   * POST /api/push-token/send
   * Body: { title: string, body: string, data?: object, imageUrl?: string }
   */
  async sendNotification(ctx) {
    const { title, body, data, imageUrl } = ctx.request.body;

    if (!title || !body) {
      return ctx.badRequest('Title and body are required');
    }

    try {
      // @ts-ignore - strapi global is available in Strapi controllers
      const result = await strapi
        .service('api::push-token.push-token')
        .sendToAll({ title, body, data, imageUrl });

      return ctx.send({
        success: true,
        message: `Notification sent to ${result.sent} devices`,
        ...result,
      });
    } catch (error) {
      strapi.log.error('Error sending notification:', error);
      return ctx.internalServerError('Failed to send notification');
    }
  },
};
