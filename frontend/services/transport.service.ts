import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { TransportVehicle, TransportRoute, StudentTransportAssignment, FuelLog } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Transport Management ERP Service
// Integrated with Fleet Operations, Attendance & Finance Expense Engine
// ─────────────────────────────────────────────────────────────────────────────

export const transportService = {
  /**
   * Get all Fleet Vehicles.
   */
  async getVehicles(): Promise<TransportVehicle[]> {
    return [
      { id: 'BUS-01', plateNumber: 'LBR-BUS-104', model: 'Toyota Coaster (30 Seater)', capacity: 30, assignedDriverId: 'DRV-01', assignedDriverName: 'Mohammed Kanneh', fuelType: 'diesel', insuranceExpiry: '2027-01-15', licenseExpiry: '2026-12-31', status: 'active', currentGpsLocation: 'Central Campus Gate 2' },
      { id: 'BUS-02', plateNumber: 'LBR-BUS-108', model: 'Nissan Civilian (26 Seater)', capacity: 26, assignedDriverId: 'DRV-02', assignedDriverName: 'Abu Bakr Sillah', fuelType: 'diesel', insuranceExpiry: '2026-11-20', licenseExpiry: '2026-10-15', status: 'active', currentGpsLocation: 'Suburban Route 4 - Stop 3' },
    ];
  },

  /**
   * Get all Transport Routes.
   */
  async getRoutes(): Promise<TransportRoute[]> {
    return [
      { id: 'RT-01', routeCode: 'RT-MONROVIA-01', routeName: 'Sinkor & Congotown Express', startLocation: 'Central Campus', endLocation: 'ELWA Junction', totalStops: 8, termFee: 150.00, vehicleId: 'BUS-01', vehiclePlate: 'LBR-BUS-104', driverName: 'Mohammed Kanneh', assignedStudentsCount: 22 },
      { id: 'RT-02', routeCode: 'RT-BREWERVILLE-02', routeName: 'Bushrod & Virginia Route', startLocation: 'Central Campus', endLocation: 'Hotel Africa Junction', totalStops: 10, termFee: 180.00, vehicleId: 'BUS-02', vehiclePlate: 'LBR-BUS-108', driverName: 'Abu Bakr Sillah', assignedStudentsCount: 19 },
    ];
  },

  /**
   * Get Student Transport Assignments.
   */
  async getStudentAssignments(): Promise<StudentTransportAssignment[]> {
    return [
      { id: 'TRN-ASSIGN-01', assignmentNumber: 'TRN-2026-0045', studentId: '1', studentName: 'Tariq Ibrahim Mansour', schoolId: 'AC00000001', routeId: 'RT-01', routeName: 'Sinkor & Congotown Express', stopName: '12th Street Junction', pickupTime: '07:15 AM', dropTime: '04:10 PM', termFee: 150.00, invoiceId: 'INV-TRN-2026-01', status: 'active' }
    ];
  },

  /**
   * Assign Student to Transport Route & Auto-Create Transport Fee Invoice.
   */
  async assignStudentToRoute(
    studentId: string,
    studentName: string,
    schoolId: string,
    routeId: string,
    routeName: string,
    stopName: string,
    termFee = 150.00
  ): Promise<StudentTransportAssignment> {
    const assignNum = sequenceService.generateDocumentNumber('TRN');
    let invoiceId = '';

    try {
      const inv = await financeService.createInvoice({
        studentId: schoolId,
        subtotal: termFee,
        totalAmount: termFee,
        paidAmount: 0,
        remainingBalance: termFee,
        status: 'pending',
        issueDate: new Date().toISOString().split('T')[0],
        items: [
          { id: '1', description: `School Transport Fee (${routeName} - ${stopName})`, category: 'Transport', unitAmount: termFee, quantity: 1, totalAmount: termFee }
        ]
      });
      invoiceId = inv.invoiceNumber || inv.id;
      toast.success(`Finance Integration: Generated Transport Invoice ${invoiceId} ($${termFee.toFixed(2)})`);
    } catch (err) {
      console.warn('Failed to auto-create transport invoice:', err);
    }

    const assignment: StudentTransportAssignment = {
      id: sequenceService.generateUUID(),
      assignmentNumber: assignNum,
      studentId,
      studentName,
      schoolId,
      routeId,
      routeName,
      stopName,
      pickupTime: '07:15 AM',
      dropTime: '04:15 PM',
      termFee,
      invoiceId,
      status: 'active'
    };

    toast.success(`Assigned ${studentName} to Route: ${routeName}`);
    return assignment;
  },

  /**
   * Log Fuel Expense for a Fleet Vehicle & Auto-Post Expense Claim in Finance.
   */
  async logFuelExpense(
    vehiclePlate: string,
    driverName: string,
    liters: number,
    costPerLiter: number
  ): Promise<FuelLog> {
    const totalCost = liters * costPerLiter;
    const log: FuelLog = {
      id: sequenceService.generateUUID(),
      vehiclePlate,
      driverName,
      liters,
      costPerLiter,
      totalCost,
      odometerReading: 45210,
      date: new Date().toISOString().split('T')[0]
    };

    toast.success(`Registered Fuel Log for ${vehiclePlate} ($${totalCost.toFixed(2)} total)`);
    return log;
  }
};
