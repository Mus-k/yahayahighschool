import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (data.totalDebitBase !== data.totalCreditBase) {
      throw new ApplicationError(`Double entry validation failed. Total Debit (${data.totalDebitBase}) does not match Total Credit (${data.totalCreditBase}).`);
    }
  },
  async beforeUpdate(event: any) {
    const { data } = event.params;
    if (data.totalDebitBase !== undefined && data.totalCreditBase !== undefined) {
      if (data.totalDebitBase !== data.totalCreditBase) {
        throw new ApplicationError(`Double entry validation failed. Total Debit (${data.totalDebitBase}) does not match Total Credit (${data.totalCreditBase}).`);
      }
    }
  }
};
