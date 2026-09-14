import type { MultilingualText, PaymentMethodType, EnterpriseWorkflowStatus } from './finance.types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Enterprise Workflow & Audit Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditTrailStep {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  notes?: string;
  statusBefore?: string;
  statusAfter?: string;
  ipAddress?: string;
  previousValue?: string;
  newValue?: string;
}

export interface ApprovalWorkflow {
  id: string;
  documentNumber: string; // e.g. ADM-2026-001, PO-2026-042
  module: 'admissions' | 'hostel' | 'transport' | 'library' | 'inventory' | 'assets' | 'procurement';
  currentStep: string;
  steps: {
    stepName: string;
    assignedRole: string;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  }[];
  isCompleted: boolean;
  isRejected: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 1 — Admissions ERP
// ─────────────────────────────────────────────────────────────────────────────

export type ApplicationType = 'online' | 'offline' | 'transfer' | 'returning';
export type AdmissionStage = 
  | 'application_received'
  | 'document_verification'
  | 'interview_scheduled'
  | 'assessment_completed'
  | 'registrar_approval'
  | 'finance_approval'
  | 'director_approval'
  | 'student_created'
  | 'fee_assigned'
  | 'enrolled'
  | 'rejected';

export interface AdmissionApplication {
  id: string;
  documentId?: string;
  applicationNumber: string; // e.g. ADM-2026-00088
  applicantName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  nationality: string;
  applicationType: ApplicationType;
  gradeApplyingFor: string;
  campusId?: string;
  academicYear: string;

  // Guardian
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;

  // Status & Workflow
  stage: AdmissionStage;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  interviewDate?: string;
  interviewNotes?: string;
  assessmentScore?: number;
  scholarshipGrantedPercentage?: number;

  // Generated Relations
  generatedStudentId?: string;
  generatedInvoiceId?: string;
  documents: { name: string; url: string; verified: boolean }[];
  auditHistory: AuditTrailStep[];

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 2 — Enterprise Hostel & Boarding ERP (Phase 5A)
// ─────────────────────────────────────────────────────────────────────────────

export interface HostelBuilding {
  id: string;
  name: string;
  code: string;
  genderAllowed: 'male' | 'female' | 'mixed';
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  supervisorName: string;
  supervisorPhone: string;
  residentAssistants?: string[];
  status: 'active' | 'maintenance' | 'closed';
  campusId?: string;
  campusName?: string;
}

export interface HostelFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  totalRooms: number;
  wardenName: string;
}

export interface RoomAsset {
  id: string;
  assetTag: string; // AST-HST-0012
  name: string;
  category: 'Bed' | 'Mattress' | 'Desk' | 'Chair' | 'Wardrobe' | 'Curtain' | 'Fan' | 'AC' | 'Keys' | 'WiFi' | 'Mirror';
  qrCodeUrl: string;
  purchaseDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  warrantyUntil: string;
  currentValueUSD: number;
  maintenanceHistory: { date: string; issue: string; cost: number; technician: string }[];
}

export interface HostelRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  roomNumber: string;
  floorNumber: number;
  roomType: 'single' | 'double' | 'triple' | 'quad' | 'vip' | 'medical_isolation' | 'guest';
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  termFee: number;
  securityDeposit: number;
  noiseScore?: number; // 1 to 10
  cleaningStatus: 'clean' | 'needs_cleaning' | 'in_progress';
  status: 'available' | 'full' | 'cleaning' | 'maintenance' | 'reserved' | 'blocked';
  photos?: string[];
  assets: RoomAsset[];
}

export interface HostelBed {
  id: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string; // e.g. Bed A, Bed B
  qrCodeData: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOccupantId?: string;
  currentOccupantName?: string;
  previousOccupants: { studentName: string; schoolId: string; stayPeriod: string }[];
}

export interface HostelMedicalAlert {
  allergies: string[];
  chronicConditions: string[];
  emergencyCarePlan: string;
  isolationRequired: boolean;
  hospitalVisitsCount: number;
  doctorContact: string;
}

export interface HostelDisciplineRecord {
  id: string;
  date: string;
  category: 'Noise' | 'Curfew Violation' | 'Smoking' | 'Fighting' | 'Unauthorized Guest' | 'Other';
  severity: 'warning' | 'suspension' | 'expulsion';
  description: string;
  status: 'open' | 'under_appeal' | 'resolved';
}

export interface HostelAttendanceRecord {
  id: string;
  date: string;
  type: 'night_roll_call' | 'curfew' | 'weekend_leave';
  status: 'present' | 'absent' | 'on_leave' | 'late';
  checkInTime?: string;
  notes?: string;
}

export interface HostelBedAllocation {
  id: string;
  allocationNumber: string; // e.g. HST-2026-0012
  studentId: string;
  studentName: string;
  schoolId: string;
  gender: 'male' | 'female';
  programName: string;
  guardianName: string;
  guardianPhone: string;
  buildingId: string;
  buildingName: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  checkInDate: string;
  checkOutDate?: string;
  status: 'active' | 'transferred' | 'vacated' | 'checked_out';
  academicYear: string;
  termFee: number;
  securityDeposit: number;
  invoiceId?: string;
  receiptId?: string;
  qrCodeUrl: string;
  agreementUrl?: string;

  // Integrated Sub-Entities
  medicalInfo: HostelMedicalAlert;
  disciplineRecords: HostelDisciplineRecord[];
  attendanceHistory: HostelAttendanceRecord[];
  financialLedger: { date: string; description: string; debit: number; credit: number; reference: string }[];
  auditTrail: AuditTrailStep[];
}

export interface GuestVisitorProfile {
  id: string;
  visitorNumber: string; // VIS-2026-0012
  visitorName: string;
  idPassportNumber: string;
  companyOrOrg?: string;
  phone: string;
  email?: string;
  vehiclePlate?: string;
  purpose: string;
  hostStudentId?: string;
  hostStudentName?: string;
  assignedRoomNumber?: string;
  arrivalDate: string;
  departureDate?: string;
  dailyChargeUSD: number;
  securityDepositUSD: number;
  invoiceId?: string;
  qrGatePassCode: string;
  status: 'checked_in' | 'checked_out' | 'overstayed';
}

export interface HostelVisitorLog {
  id: string;
  visitorName: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  relation: string;
  checkInTime: string;
  checkOutTime?: string;
  gatePassNumber: string;
}

export interface HostelMaintenanceTicket {
  id: string;
  ticketNumber: string; // MNT-HST-0042
  buildingName: string;
  roomNumber: string;
  category: 'Broken Fan' | 'Plumbing' | 'Electrical' | 'Furniture' | 'Cleaning' | 'WiFi' | 'Door Lock';
  issueDescription: string;
  reportedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnician?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  repairCostUSD?: number;
  chargedToStudent?: boolean;
  createdAt: string;
  completedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 3 — Transport Management
// ─────────────────────────────────────────────────────────────────────────────

export interface TransportVehicle {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  fuelType: 'diesel' | 'petrol' | 'electric';
  insuranceExpiry: string;
  licenseExpiry: string;
  status: 'active' | 'in_service' | 'decommissioned';
  currentGpsLocation?: string;
}

export interface TransportDriver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: string;
  experienceYears: number;
  status: 'active' | 'on_leave' | 'inactive';
}

export interface TransportRoute {
  id: string;
  routeCode: string; // e.g. RT-ALPHA-01
  routeName: string;
  startLocation: string;
  endLocation: string;
  totalStops: number;
  termFee: number;
  vehicleId?: string;
  vehiclePlate?: string;
  driverName?: string;
  assignedStudentsCount: number;
}

export interface StudentTransportAssignment {
  id: string;
  assignmentNumber: string; // TRN-2026-0045
  studentId: string;
  studentName: string;
  schoolId: string;
  routeId: string;
  routeName: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  termFee: number;
  invoiceId?: string;
  status: 'active' | 'suspended' | 'cancelled';
}

export interface FuelLog {
  id: string;
  vehiclePlate: string;
  driverName: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerReading: number;
  date: string;
  invoiceId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4 — Library ERP
// ─────────────────────────────────────────────────────────────────────────────

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  category: 'Islamic Studies' | 'STEM & Sciences' | 'Languages' | 'Literature' | 'History' | 'General Reference';
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  rackLocation: string;
  isDigital: boolean;
  pdfUrl?: string;
  coverUrl?: string;
  sectionName?: string;
  gradeLevelName?: string;
}

export interface LibraryBorrowRecord {
  id: string;
  borrowNumber: string; // LIB-2026-00120
  bookId: string;
  bookTitle: string;
  isbn: string;
  borrowerId: string;
  borrowerName: string;
  borrowerType: 'student' | 'teacher' | 'worker';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue' | 'lost' | 'damaged';
  fineAmount: number;
  finePaid: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 5 — Inventory ERP
// ─────────────────────────────────────────────────────────────────────────────

export interface InventoryWarehouse {
  id: string;
  code: string; // e.g. WH-MAIN-01
  name: string;
  location: string;
  managerName: string;
  totalItems: number;
  totalValuationUSD: number;
}

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. INV-SKU-9021
  name: string;
  description?: string;
  category: string;
  unitOfMeasure: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minimumReorderLevel: number;
  unitCostUSD: number;
  totalValueUSD: number;
  valuationMethod: 'FIFO' | 'Weighted Average';
  barcode: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface InventoryMovement {
  id: string;
  movementNumber: string; // INV-MOV-2026-088
  type: 'goods_receipt' | 'goods_issue' | 'stock_transfer' | 'adjustment' | 'cycle_count';
  itemCode: string;
  itemName: string;
  quantity: number;
  sourceWarehouse?: string;
  destinationWarehouse?: string;
  unitCostUSD: number;
  totalCostUSD: number;
  performedBy: string;
  date: string;
  referenceDocNumber?: string; // e.g. PO-2026-004
  vendorSupplier?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 6 — Asset Management
// ─────────────────────────────────────────────────────────────────────────────

export type AssetCategory = 
  | 'Buildings & Facilities'
  | 'Furniture & Fixtures'
  | 'Vehicles & Transport'
  | 'IT & Computers'
  | 'Lab Equipment'
  | 'Printers & Office Supplies'
  | 'Network & Telecom';

export interface FixedAsset {
  id: string;
  assetTag: string; // e.g. AST-2026-00412
  name: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseCostUSD: number;
  salvageValueUSD: number;
  usefulLifeYears: number;
  currentBookValueUSD: number;
  accumulatedDepreciationUSD: number;
  depreciationMethod: 'Straight Line' | 'Declining Balance';
  location: string;
  assignedDepartment?: string;
  assignedStaffName?: string;
  barcode: string;
  qrCodeUrl?: string;
  status: 'active' | 'in_repair' | 'disposed' | 'impaired';
}

export interface DepreciationScheduleItem {
  year: number;
  periodName: string;
  beginningBookValueUSD: number;
  depreciationAmountUSD: number;
  endingBookValueUSD: number;
  accumulatedDepreciationUSD: number;
  isPosted: boolean;
  postedJournalId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 7 — Procurement ERP
// ─────────────────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  vendorCode: string; // VND-2026-0012
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  ratingScore: number; // 1.0 to 5.0
  taxRegistrationNumber: string;
  bankAccountDetails: string;
  status: 'approved' | 'under_review' | 'blacklisted';
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string; // PR-2026-00881
  title: string;
  departmentName: string;
  requestedBy: string;
  estimatedTotalUSD: number;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted_to_po';
  items: { itemDescription: string; quantity: number; estimatedUnitPriceUSD: number }[];
  auditHistory: AuditTrailStep[];
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-2026-00941
  requisitionNumber?: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  subtotalUSD: number;
  taxUSD: number;
  totalAmountUSD: number;
  approvalStatus: 'draft' | 'pending_finance' | 'pending_director' | 'approved' | 'rejected';
  fulfillmentStatus: 'unfulfilled' | 'partially_received' | 'fully_received';
  threeWayMatchStatus: 'pending' | 'matched' | 'discrepancy';
  invoiceId?: string;
  items: { itemDescription: string; quantity: number; unitPriceUSD: number; totalPriceUSD: number; receivedQuantity: number }[];
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // GRN-2026-0031
  poNumber: string;
  vendorName: string;
  receivedDate: string;
  receivedBy: string;
  warehouseLocation: string;
  status: 'inspected_and_accepted' | 'rejected' | 'partial';
  items: { itemDescription: string; orderedQty: number; receivedQty: number; acceptedQty: number; rejectedQty: number }[];
}
