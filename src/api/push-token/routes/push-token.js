'use strict';

/**
 * push-token router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/push-token',
      handler: 'push-token.register',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow mobile app to register tokens without auth
      },
    },
    {
      method: 'GET',
      path: '/push-token',
      handler: 'push-token.findAll',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/push-token/:id',
      handler: 'push-token.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/push-token/send',
      handler: 'push-token.sendNotification',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
