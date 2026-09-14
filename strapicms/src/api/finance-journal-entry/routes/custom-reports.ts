export default {
  routes: [
    {
      method: 'POST',
      path: '/finance-reports/generate',
      handler: 'finance-journal-entry.generateStatement',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
