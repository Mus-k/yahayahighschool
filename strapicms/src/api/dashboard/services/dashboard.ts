export default () => ({
  async getAdminStats({ locale = 'en' } = {}) {
    const [
      students,
      teachers,
      parents,
      workers,
      sections,
      academicYears,
      departments,
      programs,
      subjects,
      curriculums,
      notifications,
      admissions,
      announcements,
      lessonPlans,
      homework,
      attendanceRecords,
      examinations,
      certificates,
      events,
      auditLogs,
    ] = await Promise.all([
      strapi.documents('api::student.student').count({}),
      strapi.documents('api::teacher.teacher').count({}),
      strapi.documents('api::parent.parent').count({}),
      strapi.documents('api::worker.worker').count({}),
      strapi.documents('api::section.section').count({}),
      strapi.documents('api::academic-year.academic-year').count({}),
      strapi.documents('api::department.department').count({}),
      strapi.documents('api::program.program').count({}),
      strapi.documents('api::subject.subject').count({}),
      strapi.documents('api::curriculum.curriculum').count({}),
      strapi.documents('api::notification.notification').count({}),
      strapi.documents('api::admission-application.admission-application').count({}),
      strapi.documents('api::announcement.announcement').count({}),
      strapi.documents('api::lesson-plan.lesson-plan').count({}),
      strapi.documents('api::homework.homework').count({}),
      strapi.documents('api::attendance-record.attendance-record').count({}),
      strapi.documents('api::examination.examination').count({}),
      strapi.documents('api::academic-certificate.academic-certificate').count({}),
      strapi.documents('api::event.event').count({}),
      strapi.documents('api::audit-log.audit-log').count({}),
    ]);

    // Recent audit logs for activity feed
    const recentActivity = await strapi.documents('api::audit-log.audit-log').findMany({
      sort: { createdAt: 'desc' },
      pagination: { limit: 10 },
    });

    // Upcoming events (localized)
    const upcomingEvents = await strapi.documents('api::event.event').findMany({
      locale,
      sort: { createdAt: 'desc' },
      pagination: { limit: 5 },
    });

    // Recent announcements (localized)
    const recentAnnouncements = await strapi.documents('api::announcement.announcement').findMany({
      locale,
      sort: { createdAt: 'desc' },
      pagination: { limit: 5 },
    });

    return {
      counts: {
        students,
        teachers,
        parents,
        workers,
        sections,
        academicYears,
        departments,
        programs,
        subjects,
        curriculums,
        notifications,
        admissions,
        announcements,
        lessonPlans,
        homework,
        attendanceRecords,
        examinations,
        certificates,
        events,
        auditLogs,
      },
      recentActivity,
      upcomingEvents,
      recentAnnouncements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getDirectorStats({ locale = 'en' } = {}) {
    const [
      students,
      teachers,
      sections,
      departments,
      examinations,
      lessonPlans,
      homework,
      attendanceRecords,
    ] = await Promise.all([
      strapi.documents('api::student.student').count({}),
      strapi.documents('api::teacher.teacher').count({}),
      strapi.documents('api::section.section').count({}),
      strapi.documents('api::department.department').count({}),
      strapi.documents('api::examination.examination').count({}),
      strapi.documents('api::lesson-plan.lesson-plan').count({}),
      strapi.documents('api::homework.homework').count({}),
      strapi.documents('api::attendance-record.attendance-record').count({}),
    ]);

    const recentAnnouncements = await strapi.documents('api::announcement.announcement').findMany({
      locale,
      sort: { createdAt: 'desc' },
      pagination: { limit: 5 },
    });

    return {
      counts: {
        students,
        teachers,
        sections,
        departments,
        examinations,
        lessonPlans,
        homework,
        attendanceRecords,
      },
      recentAnnouncements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getTeacherStats(userId: number, { locale = 'en' } = {}) {
    // Find the teacher profile linked to this user
    const teacherProfiles = await strapi.documents('api::teacher.teacher').findMany({
      filters: { user: { id: { $eq: userId } } } as any,
      populate: ['sections'] as any,
    });
    const teacher: any = teacherProfiles[0];

    if (!teacher) {
      return { assignedSections: 0, subjectCount: 0, pendingHomework: 0, pendingAssessments: 0 };
    }

    const sectionIds = (teacher.sections as any[] || []).map((s: any) => s.id);

    const [pendingHomework, pendingAssessments, attendanceRecords] = await Promise.all([
      strapi.documents('api::homework.homework').count({
        filters: { section: { id: { $in: sectionIds } } } as any,
      }),
      strapi.documents('api::examination.examination').count({}),
      strapi.documents('api::attendance-record.attendance-record').count({
        filters: { teacher: { id: { $eq: teacher.id } } } as any,
      }),
    ]);

    const recentActivity = await strapi.documents('api::audit-log.audit-log').findMany({
      sort: { createdAt: 'desc' },
      pagination: { limit: 5 },
    });

    return {
      teacherId: teacher.id,
      assignedSections: sectionIds.length,
      subjectCount: (teacher.subjects as any[] || []).length,
      pendingHomework,
      pendingAssessments,
      attendanceRecordsMarked: attendanceRecords,
      recentActivity,
      generatedAt: new Date().toISOString(),
    };
  },

  async getStudentStats(userId: number, { locale = 'en' } = {}) {
    const studentProfiles = await strapi.documents('api::student.student').findMany({
      filters: { user: { id: { $eq: userId } } } as any,
      populate: ['sections', 'academicYears', 'teachers'] as any,
    });
    const student: any = studentProfiles[0];

    if (!student) {
      return { sections: 0, teachers: 0, homework: 0, upcomingExams: 0 };
    }

    const sectionIds = (student.sections as any[] || []).map((s: any) => s.id);

    const [homework, upcomingExams, attendanceCount, announcements] = await Promise.all([
      strapi.documents('api::homework.homework').count({
        filters: { section: { id: { $in: sectionIds } } } as any,
      }),
      strapi.documents('api::examination.examination').count({}),
      strapi.documents('api::attendance-record.attendance-record').count({
        filters: { student: { id: { $eq: student.id } } } as any,
      }),
      strapi.documents('api::announcement.announcement').findMany({
        locale,
        sort: { createdAt: 'desc' },
        pagination: { limit: 5 },
      }),
    ]);

    return {
      studentId: student.id,
      schoolId: student.schoolId,
      sections: sectionIds.length,
      teachers: (student.teachers as any[] || []).length,
      pendingHomework: homework,
      upcomingExams,
      attendanceMarked: attendanceCount,
      announcements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getParentStats(userId: number, { locale = 'en' } = {}) {
    const parentProfiles = await strapi.documents('api::parent.parent').findMany({
      filters: { user: { id: { $eq: userId } } } as any,
      populate: ['children'] as any,
    });
    const parent: any = parentProfiles[0];

    if (!parent) {
      return { childrenCount: 0, upcomingEvents: 0 };
    }

    const childrenCount = (parent.children as any[] || []).length;

    const [upcomingEvents, announcements] = await Promise.all([
      strapi.documents('api::event.event').count({}),
      strapi.documents('api::announcement.announcement').findMany({
        locale,
        sort: { createdAt: 'desc' },
        pagination: { limit: 5 },
      }),
    ]);

    return {
      parentId: parent.id,
      childrenCount,
      upcomingEvents,
      announcements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getAccountantStats({ locale = 'en' } = {}) {
    const [donations, workers, announcements] = await Promise.all([
      strapi.documents('api::donation-campaign.donation-campaign').count({}),
      strapi.documents('api::worker.worker').count({}),
      strapi.documents('api::announcement.announcement').findMany({
        locale,
        sort: { createdAt: 'desc' },
        pagination: { limit: 5 },
      }),
    ]);

    const donationRecords = await strapi.documents('api::donation-campaign.donation-campaign').findMany({
      sort: { createdAt: 'desc' },
      pagination: { limit: 10 },
    });

    return {
      counts: { donations, workers },
      donationRecords,
      announcements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getAccountLeadStats({ locale = 'en' } = {}) {
    const base = await strapi.service('api::dashboard.dashboard').getAccountantStats({ locale });
    const auditLogs = await strapi.documents('api::audit-log.audit-log').findMany({
      sort: { createdAt: 'desc' },
      pagination: { limit: 10 },
    });
    return { ...base, auditLogs };
  },

  async getWorkerStats(userId: number, { locale = 'en' } = {}) {
    const workerProfiles = await strapi.documents('api::worker.worker').findMany({
      filters: { user: { id: { $eq: userId } } } as any,
    });
    const worker = workerProfiles[0];

    const announcements = await strapi.documents('api::announcement.announcement').findMany({
      locale,
      sort: { createdAt: 'desc' },
      pagination: { limit: 5 },
    });

    return {
      workerId: worker?.id ?? null,
      workerName: (worker as any)?.name ?? null,
      workerRole: (worker as any)?.role ?? null,
      announcements,
      generatedAt: new Date().toISOString(),
    };
  },

  async getDriverDashboardStats(userId: number, { locale = 'en' } = {}) {
    return strapi.service('api::dashboard.dashboard').getWorkerStats(userId, { locale });
  },

  async getExecutiveFinanceStats(academicYear = '2026-2027', { locale = 'en' } = {}) {
    // 1. Invoices Aggregation (Single source of truth for revenue & receivables)
    const invoices = await strapi.documents('api::finance-invoice.finance-invoice').findMany({
      filters: { academicYearId: { $eq: academicYear } } as any,
      limit: 5000,
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const collectedRevenueYTD = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const outstandingFees = invoices.reduce((sum, inv) => sum + Number(inv.remainingBalance || 0), 0);
    const pendingInvoicesCount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length;

    // 2. Student Wallet Liability Aggregation
    const students = await strapi.documents('api::student.student').findMany({
      fields: ['id', 'advanceBalance'],
      limit: 5000,
    });
    const walletLiabilityTotal = students.reduce((sum, s) => sum + Number((s as any).advanceBalance || 0), 0);
    const activeStudentsCount = students.length;

    // 3. Collection Rate
    const feeCollectionRate = totalInvoiced > 0 ? Math.round((collectedRevenueYTD / totalInvoiced) * 1000) / 10 : 100;

    // 4. Expenses & Payroll
    const expenses = await strapi.documents('api::finance-expense.finance-expense').findMany({
      limit: 1000,
    });
    const monthlyExpenses = expenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0);
    const pendingApprovalsCount = expenses.filter((e: any) => e.status === 'pending').length;

    const payrolls = await strapi.documents('api::finance-payroll.finance-payroll').findMany({
      limit: 100,
    });
    const payrollThisMonth = payrolls.reduce((sum, p: any) => sum + Number(p.totalAmount || 0), 0);

    // 5. Recent Ledger Transactions for Activity Feed
    const recentLedgers = await strapi.documents('api::finance-ledger-entry.finance-ledger-entry').findMany({
      sort: { transactionDate: 'desc' },
      pagination: { limit: 10 },
    });

    const recentTransactions = recentLedgers.map(l => ({
      id: l.id,
      documentNumber: l.documentNumber || `LEDG-${l.id}`,
      title: l.description || 'Ledger Entry',
      type: l.type === 'debit' ? 'Tuition Invoice' : 'Tuition Receipt',
      date: l.transactionDate ? String(l.transactionDate).split('T')[0] : new Date().toISOString().split('T')[0],
      amount: l.type === 'debit' ? -Number(l.baseAmount || 0) : Number(l.baseAmount || 0),
      status: 'posted',
    }));

    return {
      kpi: {
        totalRevenueYTD: collectedRevenueYTD,
        outstandingFees,
        todayCollections: 0,
        monthlyIncome: collectedRevenueYTD,
        monthlyExpenses,
        payrollThisMonth,
        pendingApprovalsCount,
        pendingInvoicesCount,
        activeStudentsCount,
        activeScholarshipsTotal: 0,
        netCashFlow: collectedRevenueYTD - monthlyExpenses - payrollThisMonth,
        feeCollectionRate,
        walletLiabilityTotal,
      },
      charts: {
        revenueVsExpenseMonthly: [],
        collectionsByMethod: [],
        expensesByCategory: [],
        budgetVsActualDepartment: [],
      },
      treasuryInsights: {
        totalBankBalance: collectedRevenueYTD * 0.7,
        totalCashInDrawer: collectedRevenueYTD * 0.1,
        totalMobileMoney: collectedRevenueYTD * 0.2,
        estimatedRunwayMonths: monthlyExpenses > 0 ? Math.round(((collectedRevenueYTD * 0.8) / monthlyExpenses) * 10) / 10 : 12,
      },
      recentTransactions,
      generatedAt: new Date().toISOString(),
    };
  },
});
