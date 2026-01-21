module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/article/:id',
      handler: 'deep-link.redirectPlace',
      config: {
        auth: false, // No authentication required
      },
    },
    {
      method: 'GET',
      path: '/category/:name',
      handler: 'deep-link.redirectCategory',
      config: {
        auth: false,
      },
    },
  ],
};
