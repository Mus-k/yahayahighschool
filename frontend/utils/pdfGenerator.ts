import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to load image as HTMLImageElement
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export const generateInstitutionalPDF = async (
  reportType: string,
  academicYear: string,
  dateRange: string,
  preparedBy: string,
  preparedByEmail: string,
  hashId: string,
  reportData: any,
  currencyCode: string = 'USD',
  currencySymbol: string = '$',
  exchangeRate: number = 1.0
) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const nowStr = new Date().toLocaleString('en-GB');

  // 1. Add School Logo at Top Left Corner
  try {
    const logoImg = await loadImage('/yahaya-logo.jpeg');
    doc.addImage(logoImg, 'JPEG', 40, 35, 55, 55);
  } catch (err) {
    console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
  }

  // 2. Header Title & Metadata (positioned next to logo)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YAHAYASCOOL', 105, 50);

  doc.setFontSize(12);
  doc.text('Certified Institutional Financial Statements', 105, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${academicYear}`, 105, 83);
  doc.text(`Reporting Period: ${dateRange}`, 105, 95);
  doc.text(`Generated on: ${nowStr}`, 105, 107);

  // 3. Institution Info Box (Top Right)
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(360, 35, 195, 80, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Institution Information', 370, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Address: 123 Education Ave, Campus Main', 370, 63);
  doc.text('Phone: +1 234 567 890', 370, 75);
  doc.text('Email: finance@yahayaschool.edu', 370, 87);
  doc.text(`Reporting Currency: ${currencyCode} (${currencySymbol})`, 370, 99);

  let yPos = 140;

  const balances = reportData?.balances || {};
  const totalDebits = (reportData?.totalDebits || 0) * exchangeRate;
  const totalCredits = (reportData?.totalCredits || 0) * exchangeRate;

  const formatMoney = (val: number) => {
    const converted = (val || 0) * exchangeRate;
    if (!converted) return `${currencySymbol}0.00`;
    return converted < 0 
      ? `-${currencySymbol}${Math.abs(converted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : `${currencySymbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 4. Report Content Sections
  if (reportType === 'Income Statement' || reportType === 'All') {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`INCOME STATEMENT (PROFIT & LOSS) [${currencyCode}]`, 40, yPos);
    yPos += 15;

    const tuitionRev = balances['4010'] || 0;
    const waqfDonations = balances['4020'] || 0;
    const auxRev = balances['4030'] || 0;
    const hostelRev = balances['4040'] || 0;
    const totalRev = tuitionRev + waqfDonations + auxRev + hostelRev;

    const revRows = [
      ['4010 - Academic Tuition Fees (Net of Discounts)', formatMoney(tuitionRev)],
      ['4020 - Waqf & Institutional Grant Contributions', formatMoney(waqfDonations)],
      ['4030 - Auxiliary Services & Cafeteria Income', formatMoney(auxRev)],
      ['4040 - Hostel Room & Boarding Revenue', formatMoney(hostelRev)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Operating & Tuition Revenue', `Amount (${currencyCode})`]],
      body: [
        ...revRows,
        [{ content: 'TOTAL OPERATING REVENUE', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalRev), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-600
      styles: { fontSize: 8, cellPadding: 4 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    const facultyExp = balances['5010'] || 0;
    const utilityExp = balances['5020'] || 0;
    const itExp = balances['5030'] || 0;
    const suppliesExp = balances['5040'] || 0;
    const maintenanceExp = balances['5050'] || 0;
    const hostelExp = balances['5060'] || 0;
    const totalExp = facultyExp + utilityExp + itExp + suppliesExp + maintenanceExp + hostelExp;

    const expRows = [
      ['5010 - Faculty Salaries, Overtime & HR Benefits', formatMoney(facultyExp)],
      ['5020 - Campus Utilities, Diesel & Generator Supply', formatMoney(utilityExp)],
      ['5030 - IT Infrastructure & Lab Equipment', formatMoney(itExp)],
      ['5040 - Teaching Supplies & Academic Materials', formatMoney(suppliesExp)],
      ['5050 - Campus Maintenance & Repairs', formatMoney(maintenanceExp)],
      ['5060 - Hostel Maintenance & Operations', formatMoney(hostelExp)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Operating Expenditures', `Amount (${currencyCode})`]],
      body: [
        ...expRows,
        [{ content: 'TOTAL OPERATING EXPENSES', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalExp), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }, // red-500
      styles: { fontSize: 8, cellPadding: 4 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    const netSurplus = totalRev - totalExp;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(40, yPos, 515, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET SURPLUS / (DEFICIT) BEFORE DEPRECIATION (${currencyCode}):`, 50, yPos + 16);
    doc.text(formatMoney(netSurplus), 460, yPos + 16);
    doc.setTextColor(0, 0, 0);

    yPos += 45;
  }

  if (reportType === 'Balance Sheet' || reportType === 'All') {
    if (yPos > 580) {
      doc.addPage();
      yPos = 40;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`INSTITUTIONAL BALANCE SHEET [${currencyCode}]`, 40, yPos);
    yPos += 15;

    const bank = balances['1010'] || 0;
    const mobile = balances['1020'] || 0;
    const cash = balances['1030'] || 0;
    const cheque = balances['1040'] || 0;
    const ar = balances['1100'] || 0;
    const property = balances['1500'] || 0;
    const totalAssets = bank + mobile + cash + cheque + ar + property;

    const assetRows = [
      ['1010 - Bank Account Treasury (Islamic & Commercial)', formatMoney(bank)],
      ['1020 - Mobile Money Treasury (Orange/MTN/Wave)', formatMoney(mobile)],
      ['1030 - Cash Account Treasury', formatMoney(cash)],
      ['1040 - Cheque Account Treasury', formatMoney(cheque)],
      ['1100 - Student Accounts Receivable (Net of Provisions)', formatMoney(ar)],
      ['1500 - Campus Land, Buildings & Facilities', formatMoney(property)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Institutional Assets', `Amount (${currencyCode})`]],
      body: [
        ...assetRows,
        [{ content: 'TOTAL INSTITUTIONAL ASSETS', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalAssets), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }, // sky-500
      styles: { fontSize: 8, cellPadding: 4 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    const ap = balances['2010'] || 0;
    const unearned = balances['2020'] || 0;
    const wallet = balances['2050'] || 0;
    const totalLiab = ap + unearned + wallet;

    const netSurplusVal = ((balances['4010'] || 0) + (balances['4020'] || 0) + (balances['4030'] || 0) + (balances['4040'] || 0)) - ((balances['5010'] || 0) + (balances['5020'] || 0) + (balances['5030'] || 0) + (balances['5040'] || 0) + (balances['5050'] || 0) + (balances['5060'] || 0));
    const retainedEq = balances['3010'] || 0;
    const totalEq = retainedEq + netSurplusVal;

    autoTable(doc, {
      startY: yPos,
      head: [['Liabilities & Institutional Equity', `Amount (${currencyCode})`]],
      body: [
        ['2010 - Accounts Payable & Vendor Liabilities', formatMoney(ap)],
        ['2020 - Unearned / Prepaid Student Tuition', formatMoney(unearned)],
        ['2050 - Student Advance Wallet Liability', formatMoney(wallet)],
        [{ content: 'TOTAL LIABILITIES', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalLiab), styles: { fontStyle: 'bold' } }],
        ['3010 - Retained Institutional Equity', formatMoney(retainedEq)],
        ['Current Period Net Surplus (P&L)', formatMoney(netSurplusVal)],
        [{ content: 'TOTAL EQUITY', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalEq), styles: { fontStyle: 'bold' } }],
        [{ content: 'TOTAL LIABILITIES & EQUITY', styles: { fontStyle: 'bold' } }, { content: formatMoney(totalLiab + totalEq), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }, // amber-500
      styles: { fontSize: 8, cellPadding: 4 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 45;
  }

  // Ensure space for signatures
  if (yPos > 660) {
    doc.addPage();
    yPos = 40;
  }

  // 5. Signatures Block (Clean horizontal layout across page)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared By:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${preparedBy}`, 40, yPos + 13);
  doc.text(`${preparedByEmail}`, 40, yPos + 24);
  doc.line(40, yPos + 30, 180, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (Finance Director):', 210, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance Director Signature', 210, yPos + 13);
  doc.line(210, yPos + 30, 360, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Approved By (Executive Director):', 390, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Executive Director Signature', 390, yPos + 13);
  doc.line(390, yPos + 30, 540, yPos + 30);

  // 6. Absolute Page Bottom Footer (Y = 740) with Footer Text on Left and QR Code on Right
  const footerY = 740;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated Automatically by YAHAYASCOOL ERP — Double-Entry Accounting Engine', 40, footerY);
  doc.text(`Document Verification Hash: ${hashId}`, 40, footerY + 12);
  doc.text(`Live Reconciliation Audit Log: Total Debits: $${totalDebits.toFixed(2)} | Total Credits: $${totalCredits.toFixed(2)}`, 40, footerY + 24);

  // Verification QR Code at Absolute Bottom Right Corner (x: 470, y: 720)
  const qrPayload = `YAHAYASCOOL CERTIFIED FINANCIAL AUDIT VERIFICATION
Admin / Prepared By: ${preparedBy}
Email: ${preparedByEmail}
Generated Date: ${nowStr}
Academic Year: ${academicYear}
Report Hash: ${hashId}`;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 475, footerY - 25, 75, 75);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Scan to Verify QR', 480, footerY + 57);
  } catch (err) {
    console.warn('[PDF] Could not load QR code image:', err);
  }

  // Save PDF file
  doc.save(`YAHAYASCOOL_${reportType.replace(/\s+/g, '_')}_${academicYear}.pdf`);
};

export const generatePayslipPDF = async (payroll: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const nowStr = new Date().toLocaleString('en-GB');
  const refNum = payroll.payrollNumber || `PAY-2026-${String(payroll.id).padStart(4, '0')}`;

  // 1. Add School Logo at Top Left Corner
  try {
    const logoImg = await loadImage('/yahaya-logo.jpeg');
    doc.addImage(logoImg, 'JPEG', 40, 35, 55, 55);
  } catch (err) {
    console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
  }

  // 2. Header Title & Metadata
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YAHAYASCOOL', 105, 50);

  doc.setFontSize(12);
  doc.text('Official Institutional Payslip Voucher', 105, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Voucher Ref: ${refNum}`, 105, 83);
  doc.text(`Pay Period: ${payroll.payPeriod || 'Monthly Run'}`, 105, 95);
  doc.text(`Generated Date: ${nowStr}`, 105, 107);

  // 3. Institution Info Box (Top Right)
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(360, 35, 195, 80, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Institution Information', 370, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Address: 123 Education Ave, Campus Main', 370, 63);
  doc.text('Phone: +1 234 567 890', 370, 75);
  doc.text('Email: hr-payroll@yahayaschool.edu', 370, 87);
  doc.text('Disbursement Status: ' + (payroll.status || 'Paid').toUpperCase(), 370, 99);

  let yPos = 145;

  // 4. Employee Information Box
  doc.setDrawColor(200);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, yPos, 515, 60, 6, 6, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(payroll.staffName || 'Academic Faculty Member', 55, yPos + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Staff ID: ${payroll.staffId || 'N/A'}`, 55, yPos + 42);
  doc.text(`Job Role: ${payroll.staffRole || 'Faculty'}`, 220, yPos + 42);
  doc.text(`Department: ${payroll.department || 'Academic'}`, 400, yPos + 42);

  yPos += 80;

  // 5. Compensation Breakdown Table
  const formatMoney = (val: number) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const base = payroll.baseSalary || 0;
  const ot = payroll.overtimeAmount || 0;
  const ded = payroll.deductionsAmount || 0;
  const net = payroll.netPayable || (base + ot - ded);

  const tableRows = [
    ['Base Monthly Salary', formatMoney(base), 'Basic Contractual Compensation'],
    [`Overtime Allowance (${payroll.overtimeHours || 0} hrs)`, `+${formatMoney(ot)}`, 'HR Biometric Verified Overtime'],
    ['Unpaid Leave & Tax Deductions', ded > 0 ? `-${formatMoney(ded)}` : '$0.00', 'Statutory & Absence Deductions'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Compensation Component', 'Amount (USD)', 'Notes & Remarks']],
    body: [
      ...tableRows,
      [
        { content: 'NET PAYABLE DISBURSEMENT', styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: `${formatMoney(net)} USD`, styles: { fontStyle: 'bold', fontSize: 10, textColor: [16, 185, 129] } },
        { content: 'Final Net Bank Payout', styles: { fontStyle: 'bold' } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8.5, cellPadding: 6 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 45;

  // 6. Signatures Block
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared By (HR Accountant):', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Payroll Specialist Signature', 40, yPos + 13);
  doc.line(40, yPos + 30, 180, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (Finance Lead):', 210, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance Director Signature', 210, yPos + 13);
  doc.line(210, yPos + 30, 360, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Employee Acknowledgment:', 390, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payroll.staffName || 'Staff Signature', 390, yPos + 13);
  doc.line(390, yPos + 30, 540, yPos + 30);

  // 7. Footer & Verification QR Code at Absolute Bottom Right
  const footerY = 740;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated Automatically by YAHAYASCOOL ERP — Certified Institutional Payroll Engine', 40, footerY);
  doc.text(`Voucher Audit Reference: ${refNum}`, 40, footerY + 12);
  if (payroll.journalEntryId) {
    doc.text(`GL Journal Settlement Voucher: ${payroll.journalEntryId}`, 40, footerY + 24);
  }

  const qrPayload = `YAHAYASCOOL CERTIFIED PAYSLIP VOUCHER
Ref: ${refNum}
Staff: ${payroll.staffName} (${payroll.staffId || 'N/A'})
Period: ${payroll.payPeriod}
Net Pay: $${net.toFixed(2)} USD
Generated Date: ${nowStr}`;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 475, footerY - 25, 75, 75);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Scan to Verify QR', 480, footerY + 57);
  } catch (err) {
    console.warn('[PDF] Could not load QR code image:', err);
  }

  doc.save(`Payslip_${refNum.replace(/\s+/g, '_')}.pdf`);
};

export const generateStudentStatementPDF = async (
  student: any,
  transactions: any[],
  academicYear = '2026-2027'
) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const nowStr = new Date().toLocaleString('en-GB');

  // 1. Add School Logo at Top Left Corner
  try {
    const logoImg = await loadImage('/yahaya-logo.jpeg');
    doc.addImage(logoImg, 'JPEG', 40, 35, 55, 55);
  } catch (err) {
    console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
  }

  // 2. Header Title & Metadata
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YAHAYASCOOL', 105, 50);

  doc.setFontSize(12);
  doc.text('Official Student Financial Statement Ledger', 105, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${academicYear}`, 105, 83);
  doc.text(`Statement Date: ${nowStr}`, 105, 95);

  // 3. Institution Info Box (Top Right)
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(360, 35, 195, 80, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Institution Information', 370, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Address: 123 Education Ave, Campus Main', 370, 63);
  doc.text('Phone: +1 234 567 890', 370, 75);
  doc.text('Email: billing@yahayaschool.edu', 370, 87);
  doc.text('Currency: USD ($)', 370, 99);

  let yPos = 145;

  // 4. Student Information Box
  doc.setDrawColor(200);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, yPos, 515, 60, 6, 6, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name || 'Student', 55, yPos + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`School ID: ${student.schoolId || student.studentId || 'N/A'}`, 55, yPos + 42);
  doc.text(`Class Section: ${student.sections?.[0]?.sectionCode || 'Assigned'}`, 220, yPos + 42);
  doc.text(`Status: Active Student`, 400, yPos + 42);

  yPos += 75;

  // 5. Summary KPI Cards in PDF
  const formatMoney = (val: number) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalDebits = transactions.reduce((sum, tx) => sum + (tx.debit || 0), 0);
  const totalCredits = transactions.reduce((sum, tx) => sum + (tx.credit || 0), 0);
  const closingBalance = transactions.length > 0 ? (transactions[transactions.length - 1].runningBalance || 0) : 0;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Invoiced Charges (Debits): ${formatMoney(totalDebits)}`, 40, yPos);
  doc.text(`Total Payments (Credits): ${formatMoney(totalCredits)}`, 230, yPos);
  doc.text(`Net Closing Balance Due: ${formatMoney(closingBalance)}`, 400, yPos);

  yPos += 15;

  // 6. Statement Transactions Grid Table
  const tableRows = transactions.map(tx => [
    tx.date || '',
    tx.reference || '',
    tx.description || '',
    tx.debit > 0 ? formatMoney(tx.debit) : '-',
    tx.credit > 0 ? formatMoney(tx.credit) : '-',
    formatMoney(tx.runningBalance)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Reference #', 'Transaction Details', 'Debit (Charge)', 'Credit (Payment)', 'Running Balance']],
    body: [
      ...tableRows,
      [
        { content: 'STATEMENT TOTALS & NET CLOSING BALANCE DUE', colSpan: 3, styles: { fontStyle: 'bold' } },
        { content: formatMoney(totalDebits), styles: { fontStyle: 'bold', textColor: [225, 29, 72] } },
        { content: formatMoney(totalCredits), styles: { fontStyle: 'bold', textColor: [16, 185, 129] } },
        { content: formatMoney(closingBalance), styles: { fontStyle: 'bold', textColor: [15, 23, 42] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8, cellPadding: 5 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 40;

  // Ensure space for signatures
  if (yPos > 650) {
    doc.addPage();
    yPos = 40;
  }

  // 7. Signatures Block
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared By (Bursar / Accountant):', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance Department Officer', 40, yPos + 13);
  doc.line(40, yPos + 30, 180, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (Finance Director):', 210, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance Director Signature', 210, yPos + 13);
  doc.line(210, yPos + 30, 360, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Parent / Guardian Acknowledgment:', 390, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Guardian Signature', 390, yPos + 13);
  doc.line(390, yPos + 30, 540, yPos + 30);

  // 8. Footer & Verification QR Code at Absolute Bottom Right
  const footerY = 740;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated Automatically by YAHAYASCOOL ERP — Student Billing & Ledger Engine', 40, footerY);
  doc.text(`Student School ID: ${student.schoolId || student.studentId || 'N/A'} | Academic Year: ${academicYear}`, 40, footerY + 12);
  doc.text(`Live Audit Summary: Total Debits $${totalDebits.toFixed(2)} | Total Credits $${totalCredits.toFixed(2)} | Net $${closingBalance.toFixed(2)}`, 40, footerY + 24);

  const qrPayload = `YAHAYASCOOL STUDENT FINANCIAL STATEMENT
Student: ${student.name} (${student.schoolId || student.studentId})
Academic Year: ${academicYear}
Total Charges: $${totalDebits.toFixed(2)}
Total Payments: $${totalCredits.toFixed(2)}
Ending Balance: $${closingBalance.toFixed(2)}
Generated Date: ${nowStr}`;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 475, footerY - 25, 75, 75);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Scan to Verify QR', 480, footerY + 57);
  } catch (err) {
    console.warn('[PDF] Could not load QR code image:', err);
  }

  const safeFileName = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`YAHAYASCOOL_Statement_${safeFileName}_${student.schoolId || 'N/A'}.pdf`);
};

export const generateMarksEntryPDF = async (
  sectionInfo: any,
  students: any[],
  academicYear = '2026-2027',
  term = 'Term 1 Midterm'
) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const nowStr = new Date().toLocaleString('en-GB');

  // 1. Add Logo
  try {
    const logoImg = await loadImage('/yahaya-logo.jpeg');
    doc.addImage(logoImg, 'JPEG', 40, 35, 55, 55);
  } catch (err) {
    console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
  }

  // 2. Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YAHAYASCOOL', 105, 50);

  doc.setFontSize(12);
  doc.text('Official Examination Marks & Grade Sheet', 105, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${academicYear} | ${term}`, 105, 83);
  doc.text(`Generated Date: ${nowStr}`, 105, 95);

  // 3. Section Info Box
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(360, 35, 195, 75, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Assessment Section Details', 370, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${sectionInfo.subject || 'Mathematics'}`, 370, 63);
  doc.text(`Class Section: ${sectionInfo.section || 'Section 10-A'}`, 370, 75);
  doc.text(`Faculty: ${sectionInfo.teacher || 'Academic Faculty'}`, 370, 87);

  let yPos = 135;

  // 4. Grade Sheet Table
  const tableRows = students.map((s, idx) => [
    String(idx + 1),
    s.schoolId || s.studentId || `ST-00${idx + 1}`,
    s.name,
    String(s.caScore ?? 0),
    String(s.midtermScore ?? 0),
    String(s.finalScore ?? 0),
    `${(s.totalScore ?? 0).toFixed(1)}%`,
    s.grade || 'A',
    s.status || 'Verified'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Student ID', 'Student Name', 'CA (20)', 'Midterm (30)', 'Final (50)', 'Total (100%)', 'Grade', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8, cellPadding: 5 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 40;

  if (yPos > 670) {
    doc.addPage();
    yPos = 40;
  }

  // 5. Signatures
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Instructor Signature:', 40, yPos);
  doc.line(40, yPos + 25, 180, yPos + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic HOD Review:', 210, yPos);
  doc.line(210, yPos + 25, 360, yPos + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('School Director Approval:', 390, yPos);
  doc.line(390, yPos + 25, 540, yPos + 25);

  // 6. QR Code & Footer
  const footerY = 740;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated Automatically by YAHAYASCOOL ERP — Examination & QMS Engine', 40, footerY);

  const qrPayload = `YAHAYASCOOL CERTIFIED GRADE SHEET
Subject: ${sectionInfo.subject}
Section: ${sectionInfo.section}
Academic Year: ${academicYear}
Total Students: ${students.length}
Generated Date: ${nowStr}`;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 475, footerY - 25, 75, 75);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Scan to Verify QR', 480, footerY + 57);
  } catch (err) {
    console.warn('[PDF] Could not load QR code image:', err);
  }

  doc.save(`GradeSheet_${(sectionInfo.section || 'Marks').replace(/\s+/g, '_')}.pdf`);
};

export const generateExpenseVoucherPDF = async (expense: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const nowStr = new Date().toLocaleString('en-GB');
  const refNum = expense.voucherNumber || `EXP-2026-${String(expense.id).padStart(4, '0')}`;

  // 1. Add Logo
  try {
    const logoImg = await loadImage('/yahaya-logo.jpeg');
    doc.addImage(logoImg, 'JPEG', 40, 35, 55, 55);
  } catch (err) {
    console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
  }

  // 2. Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('YAHAYASCOOL', 105, 50);

  doc.setFontSize(12);
  doc.text('Certified Operating Expense Voucher', 105, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Voucher Ref: ${refNum}`, 105, 83);
  doc.text(`Category: ${expense.category || 'Operating Expense'}`, 105, 95);
  doc.text(`Generated Date: ${nowStr}`, 105, 107);

  // 3. Institution Box
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(360, 35, 195, 80, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Institution Information', 370, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Address: 123 Education Ave, Campus Main', 370, 63);
  doc.text('Phone: +1 234 567 890', 370, 75);
  doc.text('Email: finance@yahayaschool.edu', 370, 87);
  doc.text('Workflow Status: ' + (expense.status || 'Submitted').toUpperCase(), 370, 99);

  let yPos = 145;

  // 4. Claim Details Box
  doc.setDrawColor(200);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, yPos, 515, 65, 6, 6, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(expense.title || 'Campus Operating Requisition', 55, yPos + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendor / Beneficiary: ${expense.vendorName || 'N/A'}`, 55, yPos + 42);
  doc.text(`Department: ${expense.department || 'Operations'}`, 260, yPos + 42);
  doc.text(`Requested By: ${expense.requestedBy || 'Staff'}`, 55, yPos + 56);
  doc.text(`Invoice Ref: ${expense.invoiceReference || 'CASH-REC'}`, 260, yPos + 56);

  yPos += 85;

  // 5. Amount & Authorization Table
  const formatMoney = (val: number) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  autoTable(doc, {
    startY: yPos,
    head: [['Expenditure Category', 'GL Series', 'Claim Amount (USD)', 'Audit Verification']],
    body: [
      [
        expense.category || 'Utilities',
        'Series 5000 (Operating Expenses)',
        formatMoney(expense.amount),
        'Attached Receipts & Verified'
      ],
      [
        { content: 'TOTAL CERTIFIED EXPENDITURE OUTFLOW', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: `${formatMoney(expense.amount)} USD`, styles: { fontStyle: 'bold', fontSize: 10, textColor: [225, 29, 72] } },
        { content: 'Final Treasury Outflow', styles: { fontStyle: 'bold' } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8.5, cellPadding: 6 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 45;

  // 6. Signatures Block
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Requisitioner Signature:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(expense.requestedBy || 'Staff Requisitioner', 40, yPos + 13);
  doc.line(40, yPos + 30, 180, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (Bursar / Accountant):', 210, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Accountant Verification', 210, yPos + 13);
  doc.line(210, yPos + 30, 360, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Executive Director Approval:', 390, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Director Approval Signature', 390, yPos + 13);
  doc.line(390, yPos + 30, 540, yPos + 30);

  // 7. Footer & Verification QR Code
  const footerY = 740;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated Automatically by YAHAYASCOOL ERP — Certified Institutional Expenses Engine', 40, footerY);
  doc.text(`Voucher Audit Reference: ${refNum}`, 40, footerY + 12);

  const qrPayload = `YAHAYASCOOL CERTIFIED EXPENSE VOUCHER
Ref: ${refNum}
Vendor: ${expense.vendorName}
Category: ${expense.category}
Amount: $${(expense.amount || 0).toFixed(2)} USD
Generated Date: ${nowStr}`;

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 475, footerY - 25, 75, 75);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Scan to Verify QR', 480, footerY + 57);
  } catch (err) {
    console.warn('[PDF] Could not load QR code image:', err);
  }

  doc.save(`ExpenseVoucher_${refNum.replace(/\s+/g, '_')}.pdf`);
};
