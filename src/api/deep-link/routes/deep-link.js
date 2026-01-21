module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/place/:id',
      handler: 'deep-link.redirectPlace',
      config: {
        auth: false, // No authentication required
      },
    }
  ],
};
