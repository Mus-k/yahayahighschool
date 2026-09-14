const strapi = require('@strapi/strapi').createStrapi();

strapi.start().then(async () => {
  const roleService = strapi.service('plugin::users-permissions.role');
  const roles = await roleService.find();
  const targetRoles = roles.filter(r => r.type === 'public' || r.type === 'authenticated');
  
  for (const role of targetRoles) {
    const roleWithPerms = await roleService.findOne(role.id, { populate: ['permissions'] });
    const financeApis = [
      'finance-budget', 'finance-currency', 'finance-exchange-rate', 
      'finance-expense', 'finance-hold', 'finance-invoice', 
      'finance-journal-entry', 'finance-ledger-entry', 'finance-payroll', 
      'finance-receipt', 'finance-scholarship', 'finance-sequence-counter'
    ];
    
    for (const api of financeApis) {
      const actions = ['find', 'findOne', 'create', 'update', 'delete'];
      for (const action of actions) {
        const actionString = `api::${api}.${api}.${action}`;
        const existing = roleWithPerms.permissions.find(p => p.action === actionString);
        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: actionString, role: role.id }
          });
          console.log(`Granted ${actionString} to ${role.type}`);
        }
      }
    }
  }
  
  console.log('Permissions granted successfully.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
