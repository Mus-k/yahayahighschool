/**
 * Utility helper to open and trigger standard system prints
 * for modern professional YAHAYASCOOL invoices and receipts.
 */

export function printInvoiceDocument(invoice: any) {
  if (!invoice) return;

  const schoolLogoUrl = window.location.origin + '/yahaya-logo.jpeg';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    window.location.origin + `/verify/invoice/${invoice.invoiceNumber || invoice.id}`
  )}`;

  const items = invoice.items || [
    { category: 'Tuition', description: 'Tuition Fee Payment', totalAmount: invoice.totalAmount || 0 }
  ];

  const subtotal = invoice.subtotal || invoice.totalAmount || 0;
  const paid = invoice.paidAmount || 0;
  const balance = invoice.remainingBalance ?? (subtotal - paid);

  const studentName = invoice.student
    ? `${invoice.student.firstName || ''} ${invoice.student.lastName || ''}`.trim() || invoice.student.name || invoice.studentName || 'Unknown Student'
    : invoice.studentName || 'Unknown Student';
  const studentId = invoice.student?.schoolId || invoice.studentId || 'N/A';
  const parentName = invoice.student?.parents?.[0]
    ? `${invoice.student.parents[0].firstName || ''} ${invoice.student.parents[0].lastName || ''}`.trim() || invoice.student.parents[0].name
    : 'Registered Parent Sponsor';

  const currencySymbol = invoice.invoiceCurrency?.code === 'EUR' ? '€' : invoice.invoiceCurrency?.code === 'LRD' ? 'L$' : '$';
  const currencyCode = invoice.invoiceCurrency?.code || 'USD';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 24px;
          margin-bottom: 30px;
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-area img {
          height: 64px;
          width: 64px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .school-name {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .school-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 500;
        }
        .meta-area {
          text-align: right;
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }
        .document-type {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: -0.8px;
          margin: 0;
        }
        .document-number {
          color: #10b981;
          font-family: monospace;
          font-size: 18px;
          font-weight: 800;
          margin-top: 4px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          background: #f8fafc;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
        }
        .info-block h4 {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 8px 0;
          letter-spacing: 0.8px;
        }
        .info-block p {
          font-size: 13px;
          color: #334155;
          margin: 0;
          line-height: 1.6;
        }
        .item-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .item-table th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          text-align: left;
        }
        .item-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
        }
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 50px;
        }
        .total-table {
          width: 320px;
          border-collapse: collapse;
        }
        .total-table td {
          padding: 8px 16px;
          font-size: 13px;
          color: #475569;
        }
        .total-table tr.grand-total td {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          border-top: 2px solid #e2e8f0;
          padding-top: 12px;
        }
        .total-table tr.balance-due td {
          font-size: 18px;
          font-weight: 900;
          color: #10b981;
          background-color: #f0fdf4;
          border-radius: 8px;
        }
        .footer-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-top: 1px dashed #cbd5e1;
          padding-top: 40px;
          text-align: center;
          margin-top: 60px;
        }
        .footer-qr img {
          width: 110px;
          height: 110px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px;
        }
        .footer-qr p {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
          max-width: 350px;
          line-height: 1.5;
        }
        @media print {
          body { padding: 20px; }
          .info-grid { background: none; border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <img src="${schoolLogoUrl}" alt="School Logo">
          <div>
            <div class="school-name">YAHAYASCOOL ACADEMY</div>
            <div class="school-sub">Empowering Minds, Securing Futures</div>
          </div>
        </div>
        <div class="meta-area">
          <strong>Billing Department</strong><br>
          Fish Market Sinkor<br>
          Monrovia, Liberia<br>
          finance@yahayaschool.com
        </div>
      </div>

      <div class="title-area">
        <h1 class="document-type">Student Invoice</h1>
        <div class="document-number">${invoice.invoiceNumber || 'INV-GENERAL'}</div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <h4>Billed To (Scholar)</h4>
          <p>
            <strong>Name:</strong> ${studentName}<br>
            <strong>ID Code:</strong> ${studentId}<br>
            <strong>Sponsor:</strong> ${parentName}
          </p>
        </div>
        <div class="info-block">
          <h4>Invoice Metadata</h4>
          <p>
            <strong>Issue Date:</strong> ${invoice.issueDate || new Date().toISOString().split('T')[0]}<br>
            <strong>Due Date:</strong> ${invoice.dueDate || 'N/A'}<br>
            <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${
              invoice.status === 'paid' ? '#10b981' : '#f59e0b'
            }">${invoice.status}</span>
          </p>
        </div>
      </div>

      <table class="item-table">
        <thead>
          <tr>
            <th>Billing Category & Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item: any) => `
            <tr>
              <td>
                <strong>${item.category}</strong><br>
                <span style="font-size: 11px; color: #64748b;">${item.description || 'Service allocation item'}</span>
              </td>
              <td style="text-align: right; font-weight: bold;">
                ${currencySymbol}${Number(item.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="total-section">
        <table class="total-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-weight: 500;">
              ${currencySymbol}${Number(subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td>Paid Amount:</td>
            <td style="text-align: right; font-weight: 500; color: #10b981;">
              -${currencySymbol}${Number(paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr class="grand-total balance-due">
            <td><strong>Outstanding Balance:</strong></td>
            <td style="text-align: right; font-weight: 900;">
              <strong>${currencySymbol}${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div class="footer-qr">
        <img src="${qrCodeUrl}" alt="Verification Code">
        <p>
          <strong>Official Secure Verification Portal</strong><br>
          Scan this cryptographic QR code using a mobile device to verify the legitimacy and status of this invoice.
        </p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

export function printReceiptDocument(receipt: any) {
  if (!receipt) return;

  const schoolLogoUrl = window.location.origin + '/yahaya-logo.jpeg';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    window.location.origin + `/verify/receipt/${receipt.receiptNumber}`
  )}`;

  const studentName = receipt.studentName || (receipt.student ? `${receipt.student.firstName || ''} ${receipt.student.lastName || ''}`.trim() : 'Unknown Scholar');
  const studentId = receipt.studentId || receipt.student?.schoolId || 'N/A';
  const parentName = receipt.parentName || 'Registered Parent Sponsor';

  const amount = receipt.amount || receipt.paymentAmount || 0;
  const remBal = receipt.remainingStudentBalance || 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${receipt.receiptNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 24px;
          margin-bottom: 30px;
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-area img {
          height: 64px;
          width: 64px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .school-name {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .school-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 500;
        }
        .meta-area {
          text-align: right;
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }
        .document-type {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: -0.8px;
          margin: 0;
        }
        .document-number {
          color: #10b981;
          font-family: monospace;
          font-size: 18px;
          font-weight: 800;
          margin-top: 4px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          background: #f8fafc;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
        }
        .info-block h4 {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 8px 0;
          letter-spacing: 0.8px;
        }
        .info-block p {
          font-size: 13px;
          color: #334155;
          margin: 0;
          line-height: 1.6;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .receipt-table th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          text-align: left;
        }
        .receipt-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
        }
        .receipt-table td.amount-cell {
          font-size: 20px;
          font-weight: 900;
          color: #10b981;
        }
        .footer-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-top: 1px dashed #cbd5e1;
          padding-top: 40px;
          text-align: center;
          margin-top: 60px;
        }
        .footer-qr img {
          width: 110px;
          height: 110px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px;
        }
        .footer-qr p {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
          max-width: 350px;
          line-height: 1.5;
        }
        @media print {
          body { padding: 20px; }
          .info-grid { background: none; border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <img src="${schoolLogoUrl}" alt="School Logo">
          <div>
            <div class="school-name">YAHAYASCOOL ACADEMY</div>
            <div class="school-sub">Empowering Minds, Securing Futures</div>
          </div>
        </div>
        <div class="meta-area">
          <strong>Finance Registry Drawer</strong><br>
          Fish Market Sinkor<br>
          Monrovia, Liberia<br>
          cashier@yahayaschool.com
        </div>
      </div>

      <div class="title-area">
        <h1 class="document-type">Payment Receipt</h1>
        <div class="document-number">${receipt.receiptNumber}</div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <h4>Payer Scholar Details</h4>
          <p>
            <strong>Student Name:</strong> ${studentName}<br>
            <strong>Scholar ID:</strong> ${studentId}<br>
            <strong>Parent/Sponsor:</strong> ${parentName}
          </p>
        </div>
        <div class="info-block">
          <h4>Transaction Metadata</h4>
          <p>
            <strong>Payment Date:</strong> ${receipt.paymentDate ? receipt.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0]}<br>
            <strong>Payment Method:</strong> ${receipt.paymentMethod}<br>
            <strong>Trans Reference ID:</strong> ${receipt.referenceNumber || receipt.providerTransactionId || 'N/A'}<br>
            <strong>Settlement Status:</strong> <span style="font-weight: bold; color: #10b981; text-transform: uppercase;">COMPLETED</span>
          </p>
        </div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Transaction Description</th>
            <th style="text-align: right;">Settled Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>School Fee Payment Settlement</strong><br>
              <span style="font-size: 11px; color: #64748b;">Cleared through Cashier POS Ledger reconciliation</span>
            </td>
            <td class="amount-cell" style="text-align: right;">
              $${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td>
              <span style="color: #64748b;">Remaining Active Debt Balance:</span>
            </td>
            <td style="text-align: right; font-weight: 700; color: ${remBal > 0 ? '#ef4444' : '#64748b'}">
              $${Number(remBal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="footer-qr">
        <img src="${qrCodeUrl}" alt="Verification Code">
        <p>
          <strong>Official Secure Verification Portal</strong><br>
          Scan this cryptographic QR code using a mobile device to verify the legitimacy and posting of this transaction receipt.
        </p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
