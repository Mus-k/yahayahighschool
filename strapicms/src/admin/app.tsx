import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['en', 'ar', 'fr', 'tr'],
  },
  bootstrap(app: StrapiApp) {
    // Custom administration configurations can be initialized here
  },
};
