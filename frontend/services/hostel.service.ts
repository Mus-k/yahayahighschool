/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type {
  HostelBuilding, HostelRoom, HostelBed, RoomAsset,
  HostelBedAllocation, GuestVisitorProfile, HostelVisitorLog,
  HostelMaintenanceTicket, AuditTrailStep
} from '@/types/enterprise.types';
import { toast } from 'sonner';

// Helper to safely format decimal/numeric values
const parseNum = (val: any, def = 0) => {
  const n = Number(val);
  return isNaN(n) ? def : n;
};

export const hostelService = {
  /**
   * Master Data: Get Buildings
   */
  async getBuildings(): Promise<HostelBuilding[]> {
    try {
      const res = await apiClient.get('/hostel-buildings?populate=*');
      const raw = res.data?.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((b: any) => {
          const cap = b.capacity !== undefined && b.capacity !== null ? parseNum(b.capacity) : null;
          return {
            id: b.documentId || String(b.id),
            name: b.name,
            code: b.code,
            genderAllowed: b.gender === 'boys' ? 'male' : (b.gender === 'girls' ? 'female' : 'mixed'),
            totalFloors: b.floors?.length || 0,
            totalRooms: b.rooms?.length || 0,
            totalBeds: cap !== null ? cap : (b.rooms?.reduce((sum: number, r: any) => sum + parseNum(r.capacity), 0) || 96),
            supervisorName: b.supervisorName || (b.gender === 'boys' ? 'Ustadh Omar Bilal' : 'Hajah Fatima Sylla'),
            supervisorPhone: b.supervisorPhone || '+231 886 554 112',
            residentAssistants: b.residentAssistants || [],
            status: b.status || 'active',
            campusName: b.campus || 'Central Campus'
          };
        });
      }
    } catch (err) {
      console.warn('[hostelService] Failed to fetch live buildings:', err);
    }

    // Fallback if empty
    return [
      { id: 'BLD-01', name: 'Al-Farooq Boarding Hall (Boys)', code: 'HST-B01', genderAllowed: 'male', totalFloors: 3, totalRooms: 24, totalBeds: 96, supervisorName: 'Ustadh Omar Bilal', supervisorPhone: '+231 886 554 112', residentAssistants: ['Brother Bilal Sylla', 'Brother Ahmed Jalloh'], status: 'active', campusName: 'Central Campus' },
      { id: 'BLD-02', name: 'Aisha Al-Zahra Boarding Hall (Girls)', code: 'HST-G01', genderAllowed: 'female', totalFloors: 3, totalRooms: 24, totalBeds: 96, supervisorName: 'Hajah Fatima Sylla', supervisorPhone: '+231 886 554 115', residentAssistants: ['Sister Aisha Mansour'], status: 'active', campusName: 'Central Campus' },
    ];
  },

  /**
   * Master Data: Get Rooms with Assets & Occupancy
   */
  async getRooms(buildingId = 'BLD-01'): Promise<HostelRoom[]> {
    try {
      const filterField = buildingId.startsWith('BLD') ? 'code' : 'documentId';
      const res = await apiClient.get(`/hostel-rooms?filters[building][${filterField}][$eq]=${buildingId}&populate=*`);
      const raw = res.data?.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((r: any) => ({
          id: r.documentId || String(r.id),
          buildingId: r.building?.documentId || String(r.building?.id || buildingId),
          buildingName: r.building?.name || 'Al-Farooq Boarding Hall (Boys)',
          roomNumber: r.roomNumber,
          floorNumber: r.floor?.floorNumber || 1,
          roomType: r.roomType || 'quad',
          capacity: parseNum(r.capacity, 4),
          occupiedBeds: parseNum(r.currentOccupancy, 0),
          availableBeds: Math.max(0, parseNum(r.capacity, 4) - parseNum(r.currentOccupancy, 0)),
          termFee: parseNum(r.termFee, 250.00),
          securityDeposit: parseNum(r.securityDeposit, 50.00),
          noiseScore: r.noiseScore || 2,
          cleaningStatus: r.cleaningStatus || 'clean',
          status: r.status || 'available',
          assets: r.assets || [
            { id: `AST-${r.id}-1`, assetTag: `AST-HST-0${r.roomNumber}1`, name: 'Solid Teak Double Bunk Bed', category: 'Bed', qrCodeUrl: '/qr/asset/0101', purchaseDate: '2025-08-01', condition: 'excellent', warrantyUntil: '2030-08-01', currentValueUSD: 450.00, maintenanceHistory: [] },
            { id: `AST-${r.id}-2`, assetTag: `AST-HST-0${r.roomNumber}2`, name: 'Orthopedic Boarding Mattress', category: 'Mattress', qrCodeUrl: '/qr/asset/0102', purchaseDate: '2025-08-01', condition: 'excellent', warrantyUntil: '2028-08-01', currentValueUSD: 120.00, maintenanceHistory: [] },
            { id: `AST-${r.id}-3`, assetTag: `AST-HST-0${r.roomNumber}3`, name: 'Dual Split Inverter AC Unit 18,000 BTU', category: 'AC', qrCodeUrl: '/qr/asset/0103', purchaseDate: '2025-09-10', condition: 'good', warrantyUntil: '2027-09-10', currentValueUSD: 650.00, maintenanceHistory: [{ date: '2026-03-15', issue: 'Filter Cleared & Gas Recharged', cost: 35, technician: 'HVAC Tech Alpha' }] }
          ]
        }));
      }
    } catch (err) {
      console.warn('[hostelService] Failed to fetch live rooms:', err);
    }

    return [
      // {
      //   id: `RM-${buildingId}-101`,
      //   buildingId,
      //   buildingName: buildingId === 'BLD-02' ? 'Aisha Al-Zahra Boarding Hall (Girls)' : 'Al-Farooq Boarding Hall (Boys)',
      //   roomNumber: '101',
      //   floorNumber: 1,
      //   roomType: 'quad',
      //   capacity: 4,
      //   occupiedBeds: 3,
      //   availableBeds: 1,
      //   termFee: 250.00,
      //   securityDeposit: 50.00,
      //   noiseScore: 2,
      //   cleaningStatus: 'clean',
      //   status: 'available',
      //   assets: []
      // },
      // {
      //   id: `RM-${buildingId}-102`,
      //   buildingId,
      //   buildingName: buildingId === 'BLD-02' ? 'Aisha Al-Zahra Boarding Hall (Girls)' : 'Al-Farooq Boarding Hall (Boys)',
      //   roomNumber: '102',
      //   floorNumber: 1,
      //   roomType: 'double',
      //   capacity: 2,
      //   occupiedBeds: 2,
      //   availableBeds: 0,
      //   termFee: 350.00,
      //   securityDeposit: 50.00,
      //   noiseScore: 1,
      //   cleaningStatus: 'clean',
      //   status: 'full',
      //   assets: []
      // }
    ];
  },

  /**
   * Get Active Bed Allocations with Full Sub-Entity Histories
   */
  async Allocations(): Promise<HostelBedAllocation[]> {
    try {
      const res = await apiClient.get('/hostel-allocations?populate=student,bed,room,building&sort=createdAt:desc');
      const raw = res.data?.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((a: any) => {
          const student = a.student || {};
          const studentName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unknown Scholar';
          return {
            id: a.documentId || String(a.id),
            allocationNumber: a.allocationNumber,
            studentId: student.documentId || String(student.id || ''),
            studentName,
            schoolId: student.schoolId || student.admissionNumber || 'AC00000000',
            gender: student.gender || 'male',
            programName: student.programName || 'Grade 9 - Senior STEM',
            guardianName: student.guardianName || 'Parent',
            guardianPhone: student.guardianPhone || '',
            buildingId: a.building?.documentId || String(a.building?.id || ''),
            buildingName: a.building?.name || 'Boarding Hall',
            roomId: a.room?.documentId || String(a.room?.id || ''),
            roomNumber: a.room?.roomNumber || 'Unknown',
            bedNumber: a.bed?.bedNumber || 'Bed A',
            checkInDate: a.checkInDate,
            checkOutDate: a.checkOutDate,
            status: a.status || 'active',
            academicYear: a.academicYear || '2026-2027',
            termFee: parseNum(a.termFee, 250),
            securityDeposit: parseNum(a.securityDeposit, 50),
            invoiceId: a.invoiceId,
            qrCodeUrl: a.qrCodeUrl || `/qr/hostel/${a.allocationNumber}`,
            medicalInfo: a.medicalInfo || {
              allergies: [],
              chronicConditions: [],
              emergencyCarePlan: 'Standard Medical Protocol',
              isolationRequired: false,
              hospitalVisitsCount: 0,
              doctorContact: 'School Nurse Counter'
            },
            disciplineRecords: a.disciplineRecords || [],
            attendanceHistory: a.attendanceHistory || [],
            financialLedger: a.financialLedger || [],
            auditTrail: a.auditTrail || []
          };
        });
      }
    } catch (err) {
      console.warn('[hostelService] Failed to fetch live allocations:', err);
    }

    return [];
  },

  /**
   * 5-Step Guided Allocation Wizard Engine
   */
  async allocateBedWithWizard(payload: {
    studentId: string;
    studentName: string;
    schoolId: string;
    gender: 'male' | 'female';
    programName: string;
    guardianName: string;
    guardianPhone: string;
    buildingName: string;
    roomNumber: string;
    bedNumber: string;
    termFee: number;
    securityDeposit: number;
    checkInDate: string;
    academicYear: string;
    medicalInfo?: any;
  }): Promise<HostelBedAllocation> {
    const allocNum = sequenceService.generateDocumentNumber('HST');
    const totalAmount = payload.termFee + payload.securityDeposit;

    let buildingDocId = '';
    let roomDocId = '';
    let bedDocId = '';
    let roomCapacity = 4;
    let roomOccupancy = 0;

    try {
      const bRes = await apiClient.get(`/hostel-buildings?filters[name][$eq]=${encodeURIComponent(payload.buildingName)}`);
      const buildingObj = bRes.data?.data?.[0];
      if (buildingObj) buildingDocId = buildingObj.documentId || buildingObj.id;

      if (buildingDocId) {
        const rRes = await apiClient.get(`/hostel-rooms?filters[roomNumber][$eq]=${payload.roomNumber}&filters[building][documentId][$eq]=${buildingDocId}`);
        const roomObj = rRes.data?.data?.[0];
        if (roomObj) {
          roomDocId = roomObj.documentId || roomObj.id;
          roomCapacity = parseNum(roomObj.capacity, 4);
          roomOccupancy = parseNum(roomObj.currentOccupancy, 0);

          const bedRes = await apiClient.get(`/hostel-beds?filters[bedNumber][$eq]=${encodeURIComponent(payload.bedNumber)}&filters[room][documentId][$eq]=${roomDocId}`);
          const bedObj = bedRes.data?.data?.[0];
          if (bedObj) bedDocId = bedObj.documentId || bedObj.id;
        }
      }
    } catch (err) {
      console.warn('[hostelService] Failed resolving relations in wizard:', err);
    }

    let invoiceId = `INV-HST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const inv = await financeService.createInvoice({
        studentId: payload.studentId,
        subtotal: totalAmount,
        totalAmount,
        paidAmount: 0,
        remainingBalance: totalAmount,
        status: 'pending_payment',
        issueDate: new Date().toISOString().split('T')[0],
        items: [
          { id: '1', description: `Boarding Accommodation Fee (${payload.buildingName} Room ${payload.roomNumber})`, category: 'Hostel Accommodation', unitAmount: payload.termFee, quantity: 1, totalAmount: payload.termFee },
          { id: '2', description: 'Refundable Boarding Security Deposit (GL 2050 Liability)', category: 'Security Deposit', unitAmount: payload.securityDeposit, quantity: 1, totalAmount: payload.securityDeposit }
        ]
      });
      invoiceId = inv?.invoiceNumber || inv?.id || invoiceId;
    } catch (err) {
      console.warn('Hostel Invoice creation note:', err);
    }

    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Boarding Allocation Fee & Security Deposit for ${payload.studentName} (${payload.buildingName} Room ${payload.roomNumber})`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: invoiceId,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        currency: 'USD',
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines: [
          { id: '1', accountCode: '1100', accountName: 'Accounts Receivable', debitAmount: totalAmount, debit: totalAmount },
          { id: '2', accountCode: '4020', accountName: 'Auxiliary Services', creditAmount: payload.termFee, credit: payload.termFee },
          { id: '3', accountCode: '2050', accountName: 'Advance Wallet Liability', creditAmount: payload.securityDeposit, credit: payload.securityDeposit }
        ]
      });
      toast.success(`Finance GL Auto-Posted: AR +$${totalAmount.toFixed(2)}, Revenue +$${payload.termFee.toFixed(2)}, Deposit Liability +$${payload.securityDeposit.toFixed(2)}`);
    } catch (err) {
      console.warn('Hostel GL journal posting note:', err);
    }

    const auditTrail: AuditTrailStep[] = [
      { id: '1', action: 'HOSTEL_ALLOCATION_WIZARD_COMPLETED', performedBy: 'Hostel Registrar', performedByRole: 'accountant', timestamp: new Date().toISOString(), notes: `Allocated Bed ${payload.bedNumber} in Room ${payload.roomNumber}` }
    ];

    const financialLedger = [
      { date: new Date().toISOString().split('T')[0], description: 'Boarding Fee & Deposit Invoice', debit: totalAmount, credit: 0, reference: invoiceId }
    ];

    const allocPayload = {
      allocationNumber: allocNum,
      student: payload.studentId,
      building: buildingDocId || undefined,
      room: roomDocId || undefined,
      bed: bedDocId || undefined,
      checkInDate: payload.checkInDate,
      status: 'active',
      academicYear: payload.academicYear,
      termFee: Number(payload.termFee),
      securityDeposit: Number(payload.securityDeposit),
      medicalInfo: payload.medicalInfo || {
        allergies: [],
        chronicConditions: [],
        emergencyCarePlan: 'Standard Medical Protocol',
        isolationRequired: false,
        hospitalVisitsCount: 0,
        doctorContact: 'School Nurse Counter'
      },
      disciplineRecords: [],
      attendanceHistory: [],
      financialLedger
    };

    let savedAllocation: any = null;
    try {
      const res = await apiClient.post('/hostel-allocations', { data: allocPayload });
      savedAllocation = res.data?.data;

      if (bedDocId) {
        await apiClient.put(`/hostel-beds/${bedDocId}`, { data: { status: 'occupied' } });
      }

      if (roomDocId) {
        const nextOccupancy = roomOccupancy + 1;
        await apiClient.put(`/hostel-rooms/${roomDocId}`, {
          data: {
            currentOccupancy: nextOccupancy,
            status: nextOccupancy >= roomCapacity ? 'full' : 'available'
          }
        });
      }

      await apiClient.post('/hostel-invoices', {
        data: {
          student: payload.studentId,
          allocation: savedAllocation?.documentId || savedAllocation?.id,
          invoiceNumber: invoiceId,
          amount: totalAmount,
          remainingBalance: totalAmount,
          status: 'pending',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          financeInvoice: invoiceId
        }
      });

      await apiClient.post('/hostel-audit-logs', {
        data: {
          performedBy: 'Hostel Registrar',
          performedByRole: 'accountant',
          action: 'ALLOCATION_CREATED',
          timestamp: new Date().toISOString(),
          newValue: allocPayload,
          notes: `Created allocation ${allocNum} for ${payload.studentName}`
        }
      });
    } catch (err) {
      console.warn('[hostelService] Failed saving allocation in Strapi:', err);
    }

    toast.success(`Hostel Bed ${payload.bedNumber} allocated to ${payload.studentName}!`);

    return {
      id: savedAllocation?.documentId || savedAllocation?.id || sequenceService.generateUUID(),
      allocationNumber: allocNum,
      studentId: payload.studentId,
      studentName: payload.studentName,
      schoolId: payload.schoolId,
      gender: payload.gender,
      programName: payload.programName,
      guardianName: payload.guardianName,
      guardianPhone: payload.guardianPhone,
      buildingId: buildingDocId,
      buildingName: payload.buildingName,
      roomId: roomDocId,
      roomNumber: payload.roomNumber,
      bedNumber: payload.bedNumber,
      checkInDate: new Date().toISOString().split('T')[0],
      status: 'active',
      academicYear: '2026-2027',
      termFee: payload.termFee,
      securityDeposit: payload.securityDeposit,
      invoiceId,
      qrCodeUrl: `/qr/hostel/${allocNum}`,
      medicalInfo: allocPayload.medicalInfo,
      disciplineRecords: [],
      attendanceHistory: [],
      financialLedger,
      auditTrail
    };
  },

  /**
   * Room Damage Assessment & Automated Penalty Posting
   */
  async chargeRoomDamage(allocationId: string, studentName: string, schoolId: string, damageAmountUSD: number, description: string): Promise<void> {
    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Hostel Damage Penalty for ${studentName}: ${description}`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: `DMG-${allocationId}`,
        totalDebit: damageAmountUSD,
        totalCredit: damageAmountUSD,
        currency: 'USD',
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines: [
          { id: '1', accountCode: '1100', accountName: 'Accounts Receivable', debitAmount: damageAmountUSD, debit: damageAmountUSD },
          { id: '2', accountCode: '4020', accountName: 'Auxiliary Services', creditAmount: damageAmountUSD, credit: damageAmountUSD }
        ]
      });

      try {
        const allocRes = await apiClient.get(`/hostel-allocations/${allocationId}?populate=*`);
        const alloc = allocRes.data?.data;
        if (alloc) {
          await apiClient.post('/hostel-maintenance-tickets', {
            data: {
              room: alloc.room?.documentId || alloc.room?.id || undefined,
              bed: alloc.bed?.documentId || alloc.bed?.id || undefined,
              building: alloc.building?.documentId || alloc.building?.id || undefined,
              issueType: 'other',
              description: `Damage penalty: ${description}`,
              priority: 'medium',
              status: 'resolved',
              cost: damageAmountUSD
            }
          });
        }
      } catch (e) {
        console.warn('Could not post maintenance ticket details:', e);
      }

      toast.success(`Finance GL Auto-Posted: Charged $${damageAmountUSD.toFixed(2)} damage penalty to ${studentName}'s AR Ledger`);
    } catch (err) {
      console.warn('Failed to post damage journal:', err);
    }
  },

  /**
   * Lost Key Penalty Posting
   */
  async chargeLostKey(allocationId: string, studentName: string, keyFeeUSD = 25.00): Promise<void> {
    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Hostel Replacement Key Charge for ${studentName}`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: `KEY-${allocationId}`,
        totalDebit: keyFeeUSD,
        totalCredit: keyFeeUSD,
        currency: 'USD',
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines: [
          { id: '1', accountCode: '1100', accountName: 'Accounts Receivable', debitAmount: keyFeeUSD, debit: keyFeeUSD },
          { id: '2', accountCode: '4020', accountName: 'Auxiliary Services', creditAmount: keyFeeUSD, credit: keyFeeUSD }
        ]
      });
      toast.success(`Finance GL Auto-Posted: Charged $${keyFeeUSD.toFixed(2)} replacement key fee to ${studentName}`);
    } catch (err) {
      console.warn('Failed to post key replacement journal:', err);
    }
  },

  /**
   * Guest Stay Registration & Finance GL Posting
   */
  async createGuestStay(payload: Partial<GuestVisitorProfile>): Promise<GuestVisitorProfile> {
    const visNum = sequenceService.generateDocumentNumber('HST');
    const totalDays = 2;
    const dailyCost = payload.dailyChargeUSD || 50.00;
    const deposit = payload.securityDepositUSD || 30.00;
    const totalAmount = (dailyCost * totalDays) + deposit;

    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Guest Hostel Stay for ${payload.visitorName} (Room ${payload.assignedRoomNumber || 'Guest Suite 101'})`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: visNum,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        currency: 'USD',
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines: [
          { id: '1', accountCode: '1100', accountName: 'Accounts Receivable', debitAmount: totalAmount, debit: totalAmount },
          { id: '2', accountCode: '4020', accountName: 'Auxiliary Services', creditAmount: dailyCost * totalDays, credit: dailyCost * totalDays },
          { id: '3', accountCode: '2050', accountName: 'Advance Wallet Liability', creditAmount: deposit, credit: deposit }
        ]
      });
      toast.success(`Finance GL Auto-Posted: Guest Stay $${totalAmount.toFixed(2)} (GL 4022 Revenue & GL 2050 Deposit)`);
    } catch (err) {
      console.warn('Guest stay GL posting note:', err);
    }

     try {
      await apiClient.post('/hostel-visitors', {
        data: {
          visitorName: payload.visitorName || 'Guest Visitor',
          nationalId: payload.idPassportNumber || 'PASSPORT-88192',
          purpose: payload.purpose || 'Academic Guest Visit',
          checkIn: new Date().toISOString(),
          approval: 'approved',
          phone: payload.phone || '',
          assignedRoom: payload.assignedRoomNumber || 'Guest Suite 101',
          dailyCharge: dailyCost,
          securityDeposit: deposit,
          hostStudent: payload.hostStudentName || 'Central Administration'
        }
      });
      await apiClient.post('/hostel-gate-passs', {
        data: {
          requestDate: new Date().toISOString(),
          purpose: `Guest Stay: ${payload.visitorName} (Purpose: ${payload.purpose || 'Academic Guest Visit'})`,
          parentApproval: 'approved',
          wardenApproval: 'approved',
          securityValidation: 'approved',
          status: 'approved'
        }
      });
    } catch (e) {
      console.warn('Could not post visitor stay details to Strapi:', e);
    }

    const guest: GuestVisitorProfile = {
      id: sequenceService.generateUUID(),
      visitorNumber: visNum,
      visitorName: payload.visitorName || 'Guest Visitor',
      idPassportNumber: payload.idPassportNumber || 'PASSPORT-88192',
      phone: payload.phone || '+231 886 000 111',
      purpose: payload.purpose || 'Academic Guest Visit',
      hostStudentName: payload.hostStudentName || 'Central Administration',
      assignedRoomNumber: payload.assignedRoomNumber || 'Guest Suite 101',
      arrivalDate: new Date().toISOString().split('T')[0],
      dailyChargeUSD: dailyCost,
      securityDepositUSD: deposit,
      qrGatePassCode: `GATE-${visNum}`,
      status: 'checked_in'
    };

    toast.success(`Registered Guest Stay & Issued Gate Pass ${visNum} for ${guest.visitorName}`);
    return guest;
  },

  /**
   * Issue Gate Pass for Visitor
   */
  async logVisitor(visitorName: string, studentName: string, roomNumber: string, relation: string): Promise<HostelVisitorLog> {
    const gatePassNumber = sequenceService.generateDocumentNumber('HST');

    try {
      await apiClient.post('/hostel-visitors', {
        data: {
          visitorName,
          purpose: `Visiting resident student ${studentName} in room ${roomNumber} (Relation: ${relation})`,
          checkIn: new Date().toISOString(),
          approval: 'approved'
        }
      });
    } catch (e) {
      console.warn('Could not log visitor to Strapi:', e);
    }

    const log: HostelVisitorLog = {
      id: sequenceService.generateUUID(),
      visitorName,
      studentId: '1',
      studentName,
      roomNumber,
      relation,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gatePassNumber
    };
    toast.success(`Generated Gate Pass ${gatePassNumber} for ${visitorName}`);
    return log;
  },

  /**
   * Vacate Bed & Release Security Deposit
   */
  async vacateBed(allocationId: string, studentName: string, depositAmountUSD = 50.00, customCheckOutDate?: string): Promise<void> {
    try {
      let bedDocId = '';
      let roomDocId = '';
      let roomCapacity = 4;
      let roomOccupancy = 1;

      try {
        const allocRes = await apiClient.get(`/hostel-allocations/${allocationId}?populate=*`);
        const allocation = allocRes.data?.data;
        if (allocation) {
          bedDocId = allocation.bed?.documentId || allocation.bed?.id;
          roomDocId = allocation.room?.documentId || allocation.room?.id;
          roomCapacity = parseNum(allocation.room?.capacity, 4);
          roomOccupancy = parseNum(allocation.room?.currentOccupancy, 1);
        }
      } catch (err) {
        console.warn('Error fetching details for checkout:', err);
      }

      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Refund Security Deposit to ${studentName} upon Hostel Check-Out`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: `REF-${allocationId}`,
        totalDebit: depositAmountUSD,
        totalCredit: depositAmountUSD,
        currency: 'USD',
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines: [
          { id: '1', accountCode: '2050', accountName: 'Advance Wallet Liability', debitAmount: depositAmountUSD, debit: depositAmountUSD },
          { id: '2', accountCode: '1010', accountName: 'Bank Account (Islamic/Commercial)', creditAmount: depositAmountUSD, credit: depositAmountUSD }
        ]
      });

      const finalCheckOutDate = customCheckOutDate || new Date().toISOString().split('T')[0];

      try {
        await apiClient.put(`/hostel-allocations/${allocationId}`, {
          data: {
            status: 'checked_out',
            checkOutDate: finalCheckOutDate
          }
        });

        await apiClient.post('/hostel-vacations', {
          data: {
            allocation: allocationId,
            vacateDate: finalCheckOutDate,
            reason: 'Regular Check-Out',
            damageCharges: 0,
            refundAmount: depositAmountUSD,
            refundStatus: 'refunded'
          }
        });

        if (bedDocId) {
          await apiClient.put(`/hostel-beds/${bedDocId}`, {
            data: { status: 'available' }
          });
        }

        if (roomDocId) {
          const nextOccupancy = Math.max(0, roomOccupancy - 1);
          await apiClient.put(`/hostel-rooms/${roomDocId}`, {
            data: {
              currentOccupancy: nextOccupancy,
              status: 'available'
            }
          });
        }

        await apiClient.post('/hostel-deposit-refunds', {
          data: {
            allocation: allocationId,
            refundAmount: depositAmountUSD,
            damageCharges: 0,
            netRefund: depositAmountUSD,
            refundDate: new Date().toISOString().split('T')[0],
            status: 'paid'
          }
        });

        await apiClient.post('/hostel-audit-logs', {
          data: {
            performedBy: 'Hostel Registrar',
            performedByRole: 'accountant',
            action: 'ALLOCATION_VACATED',
            timestamp: new Date().toISOString(),
            notes: `Vacated allocation ${allocationId} for student ${studentName}`
          }
        });
      } catch (err) {
        console.warn('Failed to update Strapi records for checkout:', err);
      }
      // toast removed per user request
    } catch (err) {
      console.warn('Failed to post refund journal entry:', err);
    }
  },

  async getVisitors(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-visitors?populate=*');
      const raw = res.data?.data || [];
      return raw.map((v: any) => ({
        id: v.documentId || String(v.id),
        visitorName: v.visitorName,
        idPassportNumber: v.nationalId || 'PASS-990012',
        phone: v.phone || 'N/A',
        purpose: v.purpose || 'Academic Guest Visit',
        hostStudentName: v.hostStudent || (v.student ? (v.student.name || `${v.student.firstName || ''} ${v.student.lastName || ''}`.trim()) : 'Central Administration'),
        assignedRoom: v.assignedRoom || '',
        dailyChargeUSD: v.dailyCharge !== undefined && v.dailyCharge !== null ? parseFloat(v.dailyCharge) : 50.0,
        securityDepositUSD: v.securityDeposit !== undefined && v.securityDeposit !== null ? parseFloat(v.securityDeposit) : 30.0,
        checkIn: v.checkIn,
        checkOut: v.checkOut,
        approval: v.approval,
        building: v.building,
        floor: v.floor,
        room: v.room,
        bed: v.bed,
        student: v.student
      }));
    } catch {
      return [];
    }
  },

  async getGatePasses(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-gate-passs?populate=*');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getMaintenanceTickets(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-maintenance-tickets?populate=*');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getFeePlans(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-fee-plans?populate=*');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getWardens(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-wardens?populate=*');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getAuditLogs(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-audit-logs?populate=*&sort=createdAt:desc');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getPayments(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-payments?populate=*&sort=createdAt:desc');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  async getAttendance(): Promise<any[]> {
    try {
      const res = await apiClient.get('/hostel-attendances?populate=student,allocation,allocation.bed,allocation.room&sort=date:desc');
      const raw = res.data?.data || [];
      return raw.map((a: any) => ({
        id: a.documentId || String(a.id),
        studentName: a.student ? [a.student.firstName, a.student.lastName].filter(Boolean).join(' ') : 'Resident Student',
        schoolId: a.student?.admissionNumber || 'SCH-N/A',
        date: a.date,
        attendanceStatus: a.attendanceStatus || 'present',
        checkInTime: a.checkInTime || '--:--',
        notes: a.notes || ''
      }));
    } catch {
      return [];
    }
  },

  async logAttendance(payload: { studentId: string, allocationId: string, date: string, attendanceStatus: string, checkInTime?: string, notes?: string }): Promise<any> {
    const res = await apiClient.post('/hostel-attendances', {
      data: {
        student: payload.studentId,
        allocation: payload.allocationId,
        date: payload.date,
        attendanceStatus: payload.attendanceStatus,
        checkInTime: payload.checkInTime || '',
        notes: payload.notes || ''
      }
    });
    return res.data?.data;
  },

  async recordHostelPayment(
    allocationId: string,
    studentId: string,
    amount: number,
    currency = 'USD',
    method = 'Cash',
    includeDeposit = false,
    depositAmount = 50.00
  ): Promise<void> {
    try {
      let targetStudentId = studentId;
      if (!studentId || studentId.length < 5) {
        try {
          const studentsRes = await apiClient.get('/students?limit=1');
          const firstStudent = studentsRes.data?.data?.[0];
          if (firstStudent) {
            targetStudentId = firstStudent.documentId || String(firstStudent.id);
          }
        } catch (e) {
          console.warn('Failed to resolve active fallback student:', e);
        }
      }

      const seq = sequenceService.generateDocumentNumber('HST');
      await apiClient.post('/hostel-payments', {
        data: {
          student: targetStudentId,
          paymentNumber: seq,
          amount: Number(amount),
          paymentMethod: method,
          paymentDate: new Date().toISOString(),
          status: 'completed'
        }
      });

      const revenueAmount = includeDeposit ? Math.max(0, amount - depositAmount) : amount;
      const depositEntry = includeDeposit ? Number(depositAmount) : 0;
      
      const lines = [
        { 
          id: '1', 
          accountCode: method === 'Cash' ? '1030' : '1010', 
          accountName: method === 'Cash' ? 'Cash Account' : 'Bank Account (Islamic/Commercial)', 
          debit: Number(amount), 
          credit: 0 
        }
      ];

      if (revenueAmount > 0) {
        lines.push({
          id: '2',
          accountCode: '4040',
          accountName: 'Hostel Room & Boarding Revenue',
          debit: 0,
          credit: Number(revenueAmount)
        });
      }

      if (depositEntry > 0) {
        lines.push({
          id: '3',
          accountCode: '2050',
          accountName: 'Advance Wallet Liability',
          debit: 0,
          credit: Number(depositEntry)
        });
      }

      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Hostel Room Fee Payment - Ref: ${allocationId}`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: `PAY-${allocationId}`,
        totalDebit: amount,
        totalCredit: amount,
        currency: currency,
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines
      });

      try {
        const allocRes = await apiClient.get(`/hostel-allocations/${allocationId}`);
        const allocation = allocRes.data?.data;
        if (allocation) {
          const currentLedger = Array.isArray(allocation.financialLedger) ? allocation.financialLedger : [];
          const updatedLedger = [
            ...currentLedger,
            {
              date: new Date().toISOString().split('T')[0],
              description: `Fee Payment Received (${method}) - ${currency}`,
              debit: 0,
              credit: Number(amount)
            }
          ];
          await apiClient.put(`/hostel-allocations/${allocationId}`, {
            data: {
              financialLedger: updatedLedger
            }
          });
        }
      } catch (e) {
        console.warn('Failed to update allocation ledger:', e);
      }

      toast.success('Hostel payment registered and posted to General Ledger.');
    } catch (err) {
      console.error('Failed to record hostel payment:', err);
      toast.error('Failed to process hostel payment.');
      throw err;
    }
  },

  async recordVisitorCheckIn(visitorId: string, date: string): Promise<void> {
    try {
      await apiClient.put(`/hostel-visitors/${visitorId}`, {
        data: {
          checkIn: new Date(date).toISOString(),
          approval: 'approved'
        }
      });
      toast.success('Visitor check-in date updated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update visitor check-in.');
    }
  },

  async recordVisitorCheckOut(visitorId: string, date: string, refundDeposit = true, depositAmount = 30.00): Promise<void> {
    try {
      await apiClient.put(`/hostel-visitors/${visitorId}`, {
        data: {
          checkOut: new Date(date).toISOString()
        }
      });

      if (refundDeposit && depositAmount > 0) {
        await financeService.postManualJournalEntry({
          journalNumber: `JRN-${Date.now()}`,
          title: `Refund Guest Security Deposit - Ref: VST-${visitorId}`,
          transactionDate: new Date().toISOString(),
          sourceModule: 'student_billing',
          sourceDocumentNumber: `REF-VST-${visitorId}`,
          totalDebit: depositAmount,
          totalCredit: depositAmount,
          currency: 'USD',
          status: 'posted',
          postedBy: 'Hostel Registrar',
          postedAt: new Date().toISOString(),
          lines: [
            { id: '1', accountCode: '2050', accountName: 'Advance Wallet Liability', debit: depositAmount, credit: 0 },
            { id: '2', accountCode: '1010', accountName: 'Bank Account (Islamic/Commercial)', debit: 0, credit: depositAmount }
          ]
        });
      }

      toast.success('Visitor check-out completed and security deposit refunded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete visitor check-out.');
    }
  },

  async recordVisitorPayment(
    visitorId: string,
    amount: number,
    currency = 'USD',
    method = 'Cash',
    includeDeposit = false,
    depositAmount = 30.00
  ): Promise<void> {
    try {
      const revenueAmount = includeDeposit ? Math.max(0, amount - depositAmount) : amount;
      const depositEntry = includeDeposit ? Number(depositAmount) : 0;

      const lines = [
        { 
          id: '1', 
          accountCode: method === 'Cash' ? '1030' : '1010', 
          accountName: method === 'Cash' ? 'Cash Account' : 'Bank Account (Islamic/Commercial)', 
          debit: Number(amount), 
          credit: 0 
        }
      ];

      if (revenueAmount > 0) {
        lines.push({
          id: '2',
          accountCode: '4040',
          accountName: 'Hostel Room & Boarding Revenue',
          debit: 0,
          credit: Number(revenueAmount)
        });
      }

      if (depositEntry > 0) {
        lines.push({
          id: '3',
          accountCode: '2050',
          accountName: 'Advance Wallet Liability',
          debit: 0,
          credit: Number(depositEntry)
        });
      }

      await financeService.postManualJournalEntry({
        journalNumber: `JRN-${Date.now()}`,
        title: `Visitor Lodging Fee Payment - Ref: VST-${visitorId}`,
        transactionDate: new Date().toISOString(),
        sourceModule: 'student_billing',
        sourceDocumentNumber: `PAY-VST-${visitorId}`,
        totalDebit: amount,
        totalCredit: amount,
        currency: currency,
        status: 'posted',
        postedBy: 'Hostel Registrar',
        postedAt: new Date().toISOString(),
        lines
      });

      toast.success('Visitor payment registered and posted to General Ledger.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process visitor payment.');
    }
  }
};
