const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'api');

const schemas = {
  'finance-currency': {
    isoCode: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
    symbol: { type: 'string', required: true },
    country: { type: 'string' },
    decimalPlaces: { type: 'integer', default: 2 },
    isBaseCurrency: { type: 'boolean', default: false },
    isActive: { type: 'boolean', default: true }
  },
  'finance-exchange-rate': {
    fromCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    toCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    rate: { type: 'decimal', required: true },
    effectiveDate: { type: 'date', required: true },
    expirationDate: { type: 'date' },
    status: { type: 'enumeration', enum: ['active', 'archived'], default: 'active' },
    createdByRole: { type: 'string' }
  },
  'finance-hold': {
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    holdType: { type: 'enumeration', enum: ['Admission', 'Registration', 'Examination', 'Report Card', 'Certificate', 'Promotion', 'Graduation', 'Hostel', 'Library'] },
    reason: { type: 'string' },
    expirationDate: { type: 'date' },
    status: { type: 'enumeration', enum: ['active', 'released'], default: 'active' },
    overrideReason: { type: 'string' }
  },
  'finance-accounting-period': {
    schoolId: { type: 'string' },
    periodCode: { type: 'string', unique: true },
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true },
    status: { type: 'enumeration', enum: ['open', 'closed', 'locked', 'archived'], default: 'open' }
  },
  'finance-ledger-entry': {
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    documentNumber: { type: 'string' },
    type: { type: 'enumeration', enum: ['debit', 'credit'] },
    description: { type: 'string' },
    
    // Multi-Currency compliance
    originalCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    originalAmount: { type: 'decimal' },
    exchangeRate: { type: 'decimal' },
    baseCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    baseAmount: { type: 'decimal' },
    
    runningBalance: { type: 'decimal' },
    transactionDate: { type: 'datetime' },
    referenceId: { type: 'string' }
  },
  'finance-journal-entry': {
    entryNumber: { type: 'string', unique: true },
    period: { type: 'relation', relation: 'manyToOne', target: 'api::finance-accounting-period.finance-accounting-period' },
    date: { type: 'datetime' },
    description: { type: 'string' },
    
    // Multi-Currency compliance
    originalCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    baseCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    exchangeRate: { type: 'decimal' },
    
    totalDebitOriginal: { type: 'decimal' },
    totalCreditOriginal: { type: 'decimal' },
    totalDebitBase: { type: 'decimal' },
    totalCreditBase: { type: 'decimal' },
    
    status: { type: 'enumeration', enum: ['draft', 'posted', 'voided'], default: 'draft' },
    lines: { type: 'json' } // storing journal lines as JSON for simplicity
  },
  'finance-invoice': {
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    invoiceNumber: { type: 'string', unique: true },
    academicYearId: { type: 'string' },
    termId: { type: 'string' },
    
    // Multi-Currency compliance
    invoiceCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    exchangeRateToBase: { type: 'decimal' },
    baseCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    
    subtotal: { type: 'decimal' },
    totalAmount: { type: 'decimal' },
    baseTotalAmount: { type: 'decimal' },
    
    paidAmount: { type: 'decimal' },
    basePaidAmount: { type: 'decimal' },
    remainingBalance: { type: 'decimal' },
    
    issueDate: { type: 'date' },
    dueDate: { type: 'date' },
    status: { type: 'enumeration', enum: ['draft', 'submitted', 'approved', 'pending_payment', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'], default: 'draft' },
    
    items: { type: 'json' },
    installments: { type: 'json' }
  },
  'finance-receipt': {
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    invoice: { type: 'relation', relation: 'manyToOne', target: 'api::finance-invoice.finance-invoice' },
    receiptNumber: { type: 'string', unique: true },
    
    // Multi-Currency compliance
    paymentCurrency: { type: 'relation', relation: 'manyToOne', target: 'api::finance-currency.finance-currency' },
    paymentAmount: { type: 'decimal' },
    exchangeRateToInvoice: { type: 'decimal' },
    exchangeRateToBase: { type: 'decimal' },
    baseAmount: { type: 'decimal' },
    
    paymentMethod: { type: 'enumeration', enum: ['Cash', 'Bank Transfer', 'Stripe', 'Orange Money', 'MTN Mobile Money', 'Wave', 'POS Terminal', 'Cheque'] },
    providerTransactionId: { type: 'string' },
    paymentMetadata: { type: 'json' },
    
    paymentDate: { type: 'datetime' },
    status: { type: 'enumeration', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' }
  }
};

for (const [name, attributes] of Object.entries(schemas)) {
  const schemaPath = path.join(apiDir, name, 'content-types', name, 'schema.json');
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    schema.attributes = attributes;
    
    // Turn off draft/publish for operational finance tables
    schema.options = { draftAndPublish: false };
    
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
    console.log('Updated schema for', name);
  }
}
