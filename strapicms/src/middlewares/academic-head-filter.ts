/**
 * academic-head-filter middleware
 *
 * Intercepts GET requests to the Strapi Content Manager relation endpoint for
 * the `academicHead` field on Academic Section and filters the results to only
 * return teacher profiles that are linked to users with the `section-head` role.
 *
 * Endpoint intercepted:
 *   GET /content-manager/relations/api::section.section/academicHead
 */

export default () => {
  return async (ctx: any, next: any) => {
    // Run the downstream middleware / route handler first
    await next();

    // Only intercept GET requests to the academicHead relation endpoint
    const path: string = ctx.path || '';
    const method: string = ctx.method || '';

    const isTargetEndpoint =
      method === 'GET' &&
      path.includes('relations') &&
      path.includes('academicHead');

    if (!isTargetEndpoint) return;

    console.log('[YAHAYASCOOL] academicHead-filter middleware hit. Path:', path);
    console.log('[YAHAYASCOOL] ctx.body type:', typeof ctx.body);
    if (ctx.body) {
      console.log('[YAHAYASCOOL] ctx.body keys:', Object.keys(ctx.body).join(', '));
      if (Array.isArray(ctx.body.results)) {
        console.log('[YAHAYASCOOL] results count:', ctx.body.results.length);
        if (ctx.body.results.length > 0) {
          console.log('[YAHAYASCOOL] first result:', JSON.stringify(ctx.body.results[0]).substring(0, 200));
        }
      }
    }

    try {
      // Get the Strapi instance from context (available via koa state in Strapi v5)
      const strapi = ctx.state?.strapi || (global as any).strapi;
      if (!strapi) {
        console.warn('[YAHAYASCOOL] Could not get strapi instance in middleware');
        return;
      }

      const knex = strapi.db.connection;

      // 1. Get the section-head role
      const role = await knex('up_roles').where({ type: 'section-head' }).first();
      if (!role) {
        console.warn('[YAHAYASCOOL] section-head role not found');
        return;
      }

      // 2. Get teacher profiles linked to section-head users
      //    Strapi v5 uses documentId (string) as primary identifier in CM responses
      const sectionHeadTeachers: Array<{ id: number | string; document_id: string }> = await knex('teachers as t')
        .join('teachers_user_lnk as tul', 'tul.teacher_id', 't.id')
        .join('up_users_role_lnk as url', 'url.user_id', 'tul.user_id')
        .where('url.role_id', role.id)
        .select('t.id', 't.document_id');

      const numericIdSet = new Set(sectionHeadTeachers.map(t => Number(t.id)));
      const documentIdSet = new Set(sectionHeadTeachers.map(t => t.document_id).filter(Boolean));

      console.log('[YAHAYASCOOL] Section Head teacher numeric IDs:', [...numericIdSet]);
      console.log('[YAHAYASCOOL] Section Head teacher documentIds:', [...documentIdSet]);

      // 3. Filter the response body
      if (ctx.body) {
        const isMatch = (item: any): boolean => {
          const byNumericId = item.id != null && numericIdSet.has(Number(item.id));
          const byDocumentId = item.documentId != null && documentIdSet.has(item.documentId);
          return byNumericId || byDocumentId;
        };

        if (Array.isArray(ctx.body.results)) {
          const before = ctx.body.results.length;
          ctx.body.results = ctx.body.results.filter(isMatch);
          if (ctx.body.pagination) {
            ctx.body.pagination.total = ctx.body.results.length;
          }
          console.log(`[YAHAYASCOOL] Filtered results: ${before} → ${ctx.body.results.length}`);
        }

        if (Array.isArray(ctx.body.data)) {
          const before = ctx.body.data.length;
          ctx.body.data = ctx.body.data.filter(isMatch);
          console.log(`[YAHAYASCOOL] Filtered data: ${before} → ${ctx.body.data.length}`);
        }
      }
    } catch (err: any) {
      console.error('[YAHAYASCOOL] academicHead-filter middleware error:', err.message);
    }
  };
};
