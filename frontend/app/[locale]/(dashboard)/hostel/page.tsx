/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { GuestHostelModal } from '@/components/erp/GuestHostelModal';
import { HostelAllocationWizardModal } from '@/components/erp/HostelAllocationWizardModal';
import { HostelCrudModal } from '@/components/erp/HostelCrudModal';
import { HostelInspectionDrawer } from '@/components/erp/HostelInspectionDrawer';
import { VisitorInspectionDrawer } from '@/components/erp/VisitorInspectionDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { apiClient } from '@/services/api.service';
import { hostelService } from '@/services/hostel.service';
import type { HostelBedAllocation, HostelRoom } from '@/types/enterprise.types';
import {
  AlertTriangle,
  Bed,
  Building,
  Building2,
  Calendar,
  ClipboardList,
  Eye,
  FileText,
  Home,
  KeyRound,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function HostelERPPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelBedAllocation[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [feePlans, setFeePlans] = useState<any[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');

  const [floors, setFloors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [buildingSubTab, setBuildingSubTab] = useState<'buildings' | 'floors'>('buildings');
  const [roomSubTab, setRoomSubTab] = useState<'rooms' | 'beds'>('rooms');
  const [selectedVisualRoomId, setSelectedVisualRoomId] = useState<string>('');

  // Modals & Drawer
  const [selectedAllocation, setSelectedAllocation] = useState<HostelBedAllocation | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudModalType, setCrudModalType] = useState<string>('buildings');
  const [selectedEditItem, setSelectedEditItem] = useState<any>(null);

  // Sync tab from search parameters
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('dashboard');
    }
  }, [tabParam]);

  const [hostelSettings, setHostelSettings] = useState({
    currency: 'USD',
    curfew: '10:00 PM',
    visitorAccess: '09:00 AM - 08:00 PM',
    standardDeposit: 30.00
  });

  useEffect(() => {
    const stored = localStorage.getItem('hostelSettings');
    if (stored) {
      try {
        setHostelSettings(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const blds = await hostelService.getBuildings();
      const roomsPromises = blds.map(b => hostelService.getRooms(b.id));
      const roomsLists = await Promise.all(roomsPromises);
      const allRooms = roomsLists.flat();

      const [allocs, vsts, passes, tickets, plans, wrdns, logs, pmnts, atts, flrsRes, bedsRes] = await Promise.all([
        hostelService.Allocations(),
        hostelService.getVisitors(),
        hostelService.getGatePasses(),
        hostelService.getMaintenanceTickets(),
        hostelService.getFeePlans(),
        hostelService.getWardens(),
        hostelService.getAuditLogs(),
        hostelService.getPayments(),
        hostelService.getAttendance(),
        apiClient.get('/hostel-floors?populate=*'),
        apiClient.get('/hostel-beds?populate=*')
      ]);

      let waitlist: any[] = [];
      try {
        const studentsRes = await apiClient.get('/students?filters[enrollmentStatus][$eq]=active&populate=*');
        const allActiveStudents = studentsRes.data?.data || [];
        const allocatedStudentIds = new Set(allocs.filter(a => a.status === 'active').map(a => a.studentId));
        waitlist = allActiveStudents.filter((s: any) => !allocatedStudentIds.has(s.documentId || String(s.id)));
      } catch (e) {
        console.warn('Could not load waitlist students:', e);
      }

      const rawFloors = flrsRes.data?.data || [];
      const mappedFloors = rawFloors.map((f: any) => ({
        id: f.id,
        documentId: f.documentId,
        floorName: f.floorName,
        floorNumber: f.floorNumber,
        buildingName: f.building?.name || 'Main Hall',
        capacity: f.capacity || 0,
        roomsCount: f.roomsCount !== undefined && f.roomsCount !== null ? f.roomsCount : (f.rooms?.length || 0)
      }));

      const rawBeds = bedsRes.data?.data || [];
      const mappedBeds = rawBeds.map((b: any) => ({
        id: b.id,
        documentId: b.documentId,
        bedNumber: b.bedNumber,
        roomNumber: b.room?.roomNumber || '101',
        roomId: b.room?.documentId || String(b.room?.id || ''),
        buildingName: b.room?.buildingName || 'Al-Farooq Hall',
        status: b.status || 'available'
      }));

      setRooms(allRooms);
      setAllocations(allocs);
      setVisitors(vsts);
      setGatePasses(passes);
      setMaintenanceTickets(tickets);
      setFeePlans(plans);
      setWardens(wrdns);
      setAuditLogs(logs);
      setPayments(pmnts);
      setWaitingList(waitlist);
      setBuildings(blds);
      setAttendance(atts);
      setFloors(mappedFloors);
      setBeds(mappedBeds);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hostel master data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Section Calculations
  const stats = useMemo(() => {
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupied = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
    const vacant = Math.max(0, totalBeds - occupied);
    const reserved = rooms.filter(r => r.status === 'reserved').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    const buildingsCount = buildings.length;
    const floorsCount = floors.length;
    const roomsCount = rooms.length;

    const currentBoarders = allocations.filter(a => a.status === 'active').length;
    const pendingAllocationsCount = waitingList.length;
    const checkInsToday = allocations.filter(a => a.checkInDate === new Date().toISOString().split('T')[0]).length;
    const checkOutsToday = allocations.filter(a => a.checkOutDate === new Date().toISOString().split('T')[0]).length;

    const outstandingFees = allocations.filter(a => a.status === 'active').reduce((sum, a) => sum + a.termFee, 0);
    const collectedThisMonth = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const depositsHeld = allocations.reduce((sum, a) => sum + a.securityDeposit, 0);
    const refundsPendingCount = allocations.filter(a => a.status === 'vacated').length;

    const openTickets = maintenanceTickets.filter(t => t.status === 'open').length;
    const gatePassRequestsCount = gatePasses.filter(g => g.status === 'pending').length;
    const visitorsInsideCount = visitors.filter(v => !v.checkOut).length;
    const curfewViolations = gatePasses.filter(g => g.status === 'expired').length;

    return {
      totalBeds,
      occupied,
      vacant,
      reserved,
      maintenanceRooms,
      occupancyRate,
      buildingsCount,
      floorsCount,
      roomsCount,
      currentBoarders,
      pendingAllocationsCount,
      checkInsToday,
      checkOutsToday,
      outstandingFees,
      collectedThisMonth,
      depositsHeld,
      refundsPendingCount,
      openTickets,
      gatePassRequestsCount,
      visitorsInsideCount,
      curfewViolations
    };
  }, [rooms, allocations, gatePasses, maintenanceTickets, visitors, buildings, floors, waitingList, payments]);

  // Section 5: Mapped Waiting List
  const waitingListMapped = useMemo(() => {
    if (waitingList.length > 0) {
      return waitingList.slice(0, 4).map((w, index) => ({
        name: [w.firstName, w.lastName].filter(Boolean).join(' ') || 'Scholar',
        gender: w.gender || 'Male',
        grade: w.programName || w.program?.name || 'Grade 9 STEM',
        waitingDays: index + 1,
        photo: (w.firstName?.charAt(0) || 'S') + (w.lastName?.charAt(0) || '')
      }));
    }
    return [];
  }, [waitingList]);

  // Section 6: Actionable Alerts
  const alerts = useMemo(() => {
    const list: any[] = [];
    if (stats.maintenanceRooms > 0) {
      list.push({ id: '1', message: `${stats.maintenanceRooms} room(s) currently flagged under maintenance status`, type: 'warning' });
    }
    if (stats.curfewViolations > 0) {
      list.push({ id: '2', message: `${stats.curfewViolations} gate passes expired without check-in registry`, type: 'danger' });
    }
    if (stats.openTickets > 0) {
      list.push({ id: '3', message: `${stats.openTickets} open maintenance tickets require attention`, type: 'warning' });
    }
    return list;
  }, [stats]);

  // Section 11: Wardens Duty List
  const wardensMapped = useMemo(() => {
    if (wardens.length > 0) {
      return wardens.map(w => ({
        id: w.documentId || w.id,
        documentId: w.documentId || w.id,
        name: w.employee || w.name || 'Warden Staff',
        building: w.assignedBuilding?.name || w.buildingName || 'Al-Farooq Hall',
        status: w.status === 'active' ? 'On Duty' : (w.status === 'inactive' || w.status === 'on_leave') ? 'Off Duty' : (w.status || 'Off Duty'),
        dutyShift: w.dutyShift || 'full_day',
        role: w.role || 'warden',
        phone: w.phone || 'N/A',
        email: w.email || '',
        notes: w.notes || ''
      }));
    }
    return [];
  }, [wardens]);

  // Section 13: Mapped Financial Timeline Stream
  const financialTimelineMapped = useMemo(() => {
    if (payments.length > 0) {
      return payments.slice(0, 3).map((p, idx) => ({
        id: p.id || String(idx),
        title: p.description || `Accommodation payment from student`,
        amount: `+${hostelSettings.currency} ${(p.amount || 250.0).toFixed(2)}`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Today',
        type: 'plus'
      }));
    }
    return [];
  }, [payments]);

  // Section 15: Mapped Audit System Log Feed
  const auditLogsMapped = useMemo(() => {
    if (auditLogs.length > 0) {
      return auditLogs.slice(0, 3).map((log, idx) => ({
        id: log.id || String(idx),
        action: log.action || 'System Action',
        time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        by: log.performedBy || 'System',
        notes: log.notes || log.description || 'Processed action log'
      }));
    }
    return [];
  }, [auditLogs]);

  // Section 12: Bed Occupancy Grid Visuals
  const bedGridVisuals = useMemo(() => {
    const activeRoomId = selectedVisualRoomId || (rooms.length > 0 ? rooms[0].id : '');
    if (!activeRoomId) return [];
    return beds
      .filter(b => b.roomId === activeRoomId)
      .map(b => ({
        id: b.id || b.documentId,
        name: b.bedNumber,
        status: b.status === 'occupied' ? 'occupied' : (b.status === 'maintenance' ? 'maintenance' : 'vacant'),
        occupier: b.status === 'occupied' ? 'Scholar Allocated' : (b.status === 'maintenance' ? 'Out of Service' : 'Vacant Available')
      }));
  }, [selectedVisualRoomId, rooms, beds]);

  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'allocations':
        return allocations.filter(a => {
          return !query ||
            a.studentName.toLowerCase().includes(query.toLowerCase()) ||
            a.schoolId.toLowerCase().includes(query.toLowerCase()) ||
            a.buildingName.toLowerCase().includes(query.toLowerCase()) ||
            a.roomNumber.includes(query);
        });
      case 'rooms':
        if (roomSubTab === 'beds') {
          return beds.filter(b => {
            return !query ||
              b.bedNumber.toLowerCase().includes(query.toLowerCase()) ||
              b.roomNumber.includes(query) ||
              b.buildingName.toLowerCase().includes(query.toLowerCase());
          });
        }
        return rooms.filter(r => {
          return !query ||
            r.roomNumber.includes(query) ||
            r.buildingName.toLowerCase().includes(query.toLowerCase());
        });
      case 'gatepasses':
        return gatePasses.filter(g => {
          return !query ||
            (g.studentName && g.studentName.toLowerCase().includes(query.toLowerCase())) ||
            (g.reason && g.reason.toLowerCase().includes(query.toLowerCase()));
        });
      case 'maintenance':
        return maintenanceTickets.filter(t => {
          return !query ||
            (t.issueType && t.issueType.toLowerCase().includes(query.toLowerCase())) ||
            (t.description && t.description.toLowerCase().includes(query.toLowerCase()));
        });
      case 'visitors':
        return visitors.filter(v => {
          return !query ||
            v.visitorName.toLowerCase().includes(query.toLowerCase()) ||
            (v.purpose && v.purpose.toLowerCase().includes(query.toLowerCase()));
        });
      case 'feeplans':
        return feePlans.filter(p => {
          return !query ||
            p.name.toLowerCase().includes(query.toLowerCase());
        });
      case 'buildings':
        if (buildingSubTab === 'floors') {
          return floors.filter(f => {
            return !query ||
              f.floorName.toLowerCase().includes(query.toLowerCase()) ||
              f.buildingName.toLowerCase().includes(query.toLowerCase());
          });
        }
        return buildings.filter(b => {
          return !query || b.name.toLowerCase().includes(query.toLowerCase());
        });
      case 'waiting-list':
        return waitingListMapped.filter(w => {
          return !query || w.name.toLowerCase().includes(query.toLowerCase());
        });
      case 'deposits':
        return allocations.filter(a => {
          return !query || a.studentName.toLowerCase().includes(query.toLowerCase());
        });
      case 'attendance':
        return attendance.filter(a => {
          return !query || a.studentName.toLowerCase().includes(query.toLowerCase());
        });
      case 'wardens':
        return wardensMapped.filter(w => {
          return !query || w.name.toLowerCase().includes(query.toLowerCase()) || w.building.toLowerCase().includes(query.toLowerCase());
        });
      default:
        return [];
    }
  }, [activeTab, allocations, rooms, gatePasses, maintenanceTickets, visitors, feePlans, buildings, waitingListMapped, attendance, wardensMapped, query, buildingSubTab, roomSubTab, floors, beds]);

  // Section 1: Executive KPI Cards
  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    return [
      {
        id: 'total_capacity',
        title: 'Hostel Occupancy & Capacity',
        value: `${stats.occupied} / ${stats.totalBeds} Beds`,
        subtitle: `${stats.occupancyRate}% Occupancy Rate across ${stats.buildingsCount} Halls`,
        trendDirection: 'up',
        icon: <Bed className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'available_vacant',
        title: 'Vacant Available Beds',
        value: stats.vacant.toString(),
        subtitle: `${stats.reserved} Reserved • ${stats.maintenanceRooms} Under Maintenance`,
        trendDirection: 'neutral',
        icon: <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'hostel_revenue',
        title: 'Collected Revenue (GL 4020)',
        value: `${hostelSettings.currency} ${stats.collectedThisMonth.toLocaleString('en-US')}`,
        subtitle: `Outstanding AR: ${hostelSettings.currency} ${stats.outstandingFees.toLocaleString('en-US')}`,
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'security_deposits',
        title: 'Security Deposits Held (GL 2050)',
        value: `${hostelSettings.currency} ${stats.depositsHeld.toLocaleString('en-US')}`,
        subtitle: `${stats.refundsPendingCount} Payouts Pending Release`,
        trendDirection: 'up',
        icon: <ShieldCheck className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [stats, hostelSettings]);

  const columns = useMemo(() => {
    const getActionColumn = (tabType: string) => ({
      id: 'actions-crud',
      header: 'Actions',
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setCrudModalType(tabType);
                setSelectedEditItem(item);
                setIsCrudModalOpen(true);
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this record?')) {
                  try {
                    let endpoint = '';
                    switch (tabType) {
                      case 'buildings': endpoint = '/hostel-buildings'; break;
                      case 'floors': endpoint = '/hostel-floors'; break;
                      case 'rooms': endpoint = '/hostel-rooms'; break;
                      case 'beds': endpoint = '/hostel-beds'; break;
                      case 'gatepasses': endpoint = '/hostel-gate-passs'; break;
                      case 'maintenance': endpoint = '/hostel-maintenance-tickets'; break;
                      case 'visitors': endpoint = '/hostel-visitors'; break;
                      case 'feeplans': endpoint = '/hostel-fee-plans'; break;
                      case 'wardens': endpoint = '/hostel-wardens'; break;
                      case 'attendance': endpoint = '/hostel-attendances'; break;
                    }
                    if (endpoint) {
                      const docId = item.documentId || item.id;
                      await apiClient.delete(`${endpoint}/${docId}`);
                      toast.success('Record deleted successfully.');
                      loadData();
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete record. Please check constraints.');
                  }
                }
              }}
              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
            >
              Delete
            </button>
          </div>
        );
      }
    });

    if (activeTab === 'allocations') {
      return [
        {
          accessorKey: 'allocationNumber',
          header: 'Allocation & Scholar',
          cell: ({ row }: any) => {
            const a = row.original;
            return (
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{a.allocationNumber}</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {a.studentName}
                </p>
                <span className="font-mono text-xs text-slate-500">{a.schoolId}</span>
              </div>
            );
          }
        },
        {
          accessorKey: 'buildingName',
          header: 'Building & Room',
          cell: ({ row }: any) => (
            <div>
              <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.buildingName}</span>
              <span className="text-xs text-indigo-600 font-bold">Room {row.original.roomNumber} ({row.original.bedNumber})</span>
            </div>
          )
        },
        {
          accessorKey: 'checkInDate',
          header: 'Check-In Date',
          cell: ({ row }: any) => (
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold">{row.original.checkInDate}</span>
          )
        },
        {
          accessorKey: 'termFee',
          header: 'Hostel Fee & Deposit',
          cell: ({ row }: any) => {
            const a = row.original;
            const studentPayments = payments.filter((p: any) => {
              const pStudentId = p.student?.documentId || p.student?.id || p.studentId;
              const aStudentId = a.studentId;
              return String(pStudentId) === String(aStudentId);
            });
            const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const totalDue = Number(a.termFee || 250) + Number(a.securityDeposit || 50);
            const isPaid = totalPaid >= totalDue;

            return (
              <div>
                {isPaid ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Paid
                  </span>
                ) : (
                  <>
                    <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">{hostelSettings.currency} {a.termFee.toFixed(2)} / term</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Deposit: {hostelSettings.currency} {a.securityDeposit.toFixed(2)} (GL 2050)</span>
                  </>
                )}
              </div>
            );
          }
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }: any) => <StatusBadge status={row.original.status} size="sm" />
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const a = row.original;
            return (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAllocation(a);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  Inspect
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await hostelService.chargeRoomDamage(a.id, a.studentName, a.schoolId, 45.00, 'Damaged AC Remote & Window Screen');
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200"
                >
                  Damage
                </button>
                {a.status !== 'checked_out' && a.status !== 'vacated' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to check out and vacate the bed for ${a.studentName}?`)) {
                        await hostelService.vacateBed(a.id, a.studentName);
                        loadData();
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs"
                  >
                    Vacate
                  </button>
                )}
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'rooms') {
      if (roomSubTab === 'beds') {
        return [
          {
            accessorKey: 'bedNumber',
            header: 'Bed Number',
            cell: ({ row }: any) => <span className="font-extrabold text-slate-900 dark:text-white">{row.original.bedNumber}</span>
          },
          {
            accessorKey: 'roomNumber',
            header: 'Room Number',
            cell: ({ row }: any) => <span className="font-semibold text-slate-600 dark:text-slate-400">Suite {row.original.roomNumber}</span>
          },
          {
            accessorKey: 'buildingName',
            header: 'Building Location',
            cell: ({ row }: any) => <span className="text-slate-500 font-semibold">{row.original.buildingName}</span>
          },
          {
            accessorKey: 'status',
            header: 'Bed Status',
            cell: ({ row }: any) => (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                row.original.status === 'available' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                row.original.status === 'occupied' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
              }`}>
                {row.original.status}
              </span>
            )
          },
          getActionColumn('beds')
        ] as ColumnDef<any, any>[];
      }

      return [
        {
          accessorKey: 'roomNumber',
          header: 'Room Number',
          cell: ({ row }: any) => <span className="font-extrabold text-slate-900 dark:text-white">Room {row.original.roomNumber}</span>
        },
        {
          accessorKey: 'building',
          header: 'Building Location',
          cell: ({ row }: any) => <span className="text-slate-600 dark:text-slate-300 font-semibold">{row.original.buildingName || 'Boarding Hall'}</span>
        },
        {
          accessorKey: 'roomType',
          header: 'Room Type',
          cell: ({ row }: any) => <span className="capitalize font-medium text-slate-500">{row.original.roomType} Room</span>
        },
        {
          accessorKey: 'capacity',
          header: 'Capacity & Occupancy',
          cell: ({ row }: any) => (
            <div className="flex items-center gap-2">
              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${(row.original.occupiedBeds / row.original.capacity) * 100}%` }}
                />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                {row.original.occupiedBeds} / {row.original.capacity}
              </span>
            </div>
          )
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }: any) => {
            const avail = row.original.capacity - row.original.occupiedBeds;
            return (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                avail > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
              }`}>
                {avail > 0 ? `${avail} Beds Avail` : 'Full'}
              </span>
            );
          }
        },
        getActionColumn('rooms')
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'gatepasses') {
      return [
        {
          accessorKey: 'documentId',
          header: 'Gate Pass #',
          cell: ({ row }: any) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{row.original.documentId?.slice(0, 8) || row.original.id}</span>
        },
        {
          accessorKey: 'studentName',
          header: 'Scholar / Resident',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.studentName || 'Student Resident'}</span>
        },
        {
          accessorKey: 'reason',
          header: 'Reason for Exit',
          cell: ({ row }: any) => <span className="text-slate-600 dark:text-slate-300">{row.original.reason || 'Weekend Leave'}</span>
        },
        {
          accessorKey: 'outTime',
          header: 'Exit Timestamp',
          cell: ({ row }: any) => <span className="font-mono text-xs text-slate-500">{row.original.outTime || row.original.createdAt?.split('T')[0]}</span>
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }: any) => (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              row.original.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
            }`}>
              {row.original.status || 'pending'}
            </span>
          )
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const item = row.original;
            return (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {item.status !== 'approved' ? (
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.put(`/hostel-gate-passs/${item.documentId || item.id}`, {
                          data: { status: 'approved' }
                        });
                        toast.success('Gate Pass approved!');
                        loadData();
                      } catch {
                        toast.error('Failed to approve Gate Pass');
                      }
                    }}
                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-xs"
                  >
                    Approve
                  </button>
                ) : (
                  <span className="text-slate-400 text-[10px] font-semibold mr-1">Approved</span>
                )}
                <button
                  onClick={() => {
                    setCrudModalType('gatepasses');
                    setSelectedEditItem(item);
                    setIsCrudModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this record?')) {
                      try {
                        const docId = item.documentId || item.id;
                        await apiClient.delete(`/hostel-gate-passs/${docId}`);
                        toast.success('Record deleted successfully.');
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete record.');
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
                >
                  Delete
                </button>
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'maintenance') {
      return [
        {
          accessorKey: 'id',
          header: 'Ticket ID',
          cell: ({ row }: any) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">#MT-{row.original.id}</span>
        },
        {
          accessorKey: 'issueType',
          header: 'Issue / Category',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white capitalize">{row.original.issueType || 'general'}</span>
        },
        {
          accessorKey: 'description',
          header: 'Description',
          cell: ({ row }: any) => <span className="text-slate-600 dark:text-slate-300">{row.original.description}</span>
        },
        {
          accessorKey: 'priority',
          header: 'Priority',
          cell: ({ row }: any) => (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              row.original.priority === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {row.original.priority || 'medium'}
            </span>
          )
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }: any) => (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              row.original.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
            }`}>
              {row.original.status || 'open'}
            </span>
          )
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const item = row.original;
            return (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {item.status !== 'completed' ? (
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.put(`/hostel-maintenance-tickets/${item.documentId || item.id}`, {
                          data: { status: 'completed', cost: 45.0 }
                        });
                        toast.success('Maintenance ticket marked resolved!');
                        loadData();
                      } catch {
                        toast.error('Failed to update ticket');
                      }
                    }}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs"
                  >
                    Resolve
                  </button>
                ) : (
                  <span className="text-slate-400 text-[10px] font-semibold mr-1">Resolved</span>
                )}
                <button
                  onClick={() => {
                    setCrudModalType('maintenance');
                    setSelectedEditItem(item);
                    setIsCrudModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this record?')) {
                      try {
                        const docId = item.documentId || item.id;
                        await apiClient.delete(`/hostel-maintenance-tickets/${docId}`);
                        toast.success('Record deleted successfully.');
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete record.');
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
                >
                  Delete
                </button>
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'visitors') {
      return [
        {
          accessorKey: 'visitorName',
          header: 'Guest / Visitor',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.visitorName}</span>
        },
        {
          accessorKey: 'idPassportNumber',
          header: 'ID Document',
          cell: ({ row }: any) => <span className="font-mono text-xs text-slate-500">{row.original.idPassportNumber || 'PASS-99201'}</span>
        },
        {
          accessorKey: 'phone',
          header: 'Phone Number',
          cell: ({ row }: any) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.original.phone || 'N/A'}</span>
        },
        {
          accessorKey: 'purpose',
          header: 'Purpose / Host',
          cell: ({ row }: any) => (
            <div>
              <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.purpose}</span>
              <span className="text-[11px] text-slate-500">Host: {row.original.hostStudentName || 'Resident Student'}</span>
            </div>
          )
        },
        {
          id: 'assignedLodging',
          header: 'Assigned Accommodation',
          cell: ({ row }: any) => {
            const visitor = row.original;
            const bName = visitor.building?.name || '';
            const fName = visitor.floor?.floorName || '';
            const rNo = visitor.room?.roomNumber || '';
            const bNo = visitor.bed?.bedNumber || '';
            
            const scopeParts = [];
            if (bName) scopeParts.push(bName);
            if (fName) scopeParts.push(fName);
            if (rNo) scopeParts.push(`Suite ${rNo}`);
            if (bNo) scopeParts.push(`Bed ${bNo}`);
            
            const dynamicScope = scopeParts.join(' • ');
            const staticRoom = visitor.assignedRoom || '';
            
            return (
              <div className="space-y-0.5 text-xs">
                {dynamicScope ? (
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{dynamicScope}</span>
                ) : (
                  <span className="font-semibold text-slate-600 dark:text-slate-400 block">{staticRoom || 'Not Assigned'}</span>
                )}
                {dynamicScope && staticRoom && (
                  <span className="text-[10px] text-slate-500 block">Note: {staticRoom}</span>
                )}
              </div>
            );
          }
        },
        {
          accessorKey: 'dailyChargeUSD',
          header: 'Rates / Deposit',
          cell: ({ row }: any) => (
            <div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{hostelSettings.currency} {row.original.dailyChargeUSD || 50.0}/day</span>
              <span className="text-[10px] text-slate-500">Deposit: {hostelSettings.currency} {row.original.securityDepositUSD || 30.0} (GL 2050)</span>
            </div>
          )
        },
        {
          id: 'visitor-status',
          header: 'Status',
          cell: ({ row }: any) => {
            const v = row.original;
            if (v.checkOut) {
              return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Checked Out
                </span>
              );
            }
            if (v.checkIn) {
              return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Checked In
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Registered
              </span>
            );
          }
        },
        {
          id: 'visitor-actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const visitor = row.original;
            return (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setSelectedVisitor(visitor);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[10px] border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  Inspect
                </button>
                <button
                  onClick={() => {
                    setCrudModalType('visitors');
                    setSelectedEditItem(visitor);
                    setIsCrudModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this visitor log?')) {
                      try {
                        const docId = visitor.documentId || visitor.id;
                        await apiClient.delete(`/hostel-visitors/${docId}`);
                        toast.success('Visitor log deleted successfully.');
                        loadData();
                      } catch (err) {
                        toast.error('Failed to delete visitor log.');
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
                >
                  Delete
                </button>
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'feeplans') {
      return [
        {
          accessorKey: 'planName',
          header: 'Plan Name & Period',
          cell: ({ row }: any) => {
            const plan = row.original;
            const nameStr = plan.planName || plan.name || 'Standard Plan';
            const yearStr = plan.academicYear || 'AY 2026/2027';
            const termStr = plan.term || 'Term 1';

            let scopeLabel = '';
            if (plan.bed) {
              scopeLabel = `Bed: ${plan.bed.bedNumber}`;
            } else if (plan.room) {
              scopeLabel = `Room: ${plan.room.roomNumber}`;
            } else if (plan.floor) {
              scopeLabel = `Floor: ${plan.floor.floorName}`;
            } else if (plan.building) {
              scopeLabel = `Bld: ${plan.building.name}`;
            } else {
              scopeLabel = 'All Hostels';
            }

            return (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white">{nameStr}</span>
                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${
                    scopeLabel === 'All Hostels'
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                  }`}>
                    {scopeLabel}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                  {yearStr} • {termStr}
                </span>
              </div>
            );
          }
        },
        {
          accessorKey: 'accommodationFee',
          header: `Accommodation Fee (${hostelSettings.currency})`,
          cell: ({ row }: any) => {
            const fee = row.original.accommodationFee !== undefined ? row.original.accommodationFee : row.original.termFee;
            return <span className="font-mono font-bold text-emerald-600">{hostelSettings.currency} {Number(fee || 0).toFixed(2)}</span>;
          }
        },
        {
          accessorKey: 'securityDeposit',
          header: `Security Deposit (${hostelSettings.currency})`,
          cell: ({ row }: any) => <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{hostelSettings.currency} {Number(row.original.securityDeposit || 0).toFixed(2)}</span>
        },
        {
          id: 'optionalFees',
          header: `Additional Services (${hostelSettings.currency})`,
          cell: ({ row }: any) => {
            const plan = row.original;
            const laundry = Number(plan.laundryFee || 0);
            const meal = Number(plan.mealFee || 0);
            const transport = Number(plan.transportFee || 0);
            const utility = Number(plan.utilityFee || 0);

            return (
              <div className="flex flex-wrap gap-1 max-w-[280px]">
                {laundry > 0 && <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-mono">Laundry: {hostelSettings.currency} {laundry.toFixed(2)}</span>}
                {meal > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-mono">Meal: {hostelSettings.currency} {meal.toFixed(2)}</span>}
                {transport > 0 && <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">Trans: {hostelSettings.currency} {transport.toFixed(2)}</span>}
                {utility > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-mono">Util: {hostelSettings.currency} {utility.toFixed(2)}</span>}
                {laundry === 0 && meal === 0 && transport === 0 && utility === 0 && <span className="text-slate-400 text-[11px]">None</span>}
              </div>
            );
          }
        },
        getActionColumn('feeplans')
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'buildings') {
      if (buildingSubTab === 'floors') {
        return [
          {
            accessorKey: 'floorName',
            header: 'Floor Name',
            cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.floorName}</span>
          },
          {
            accessorKey: 'floorNumber',
            header: 'Floor Number',
            cell: ({ row }: any) => <span className="font-mono font-semibold">{row.original.floorNumber}</span>
          },
          {
            accessorKey: 'buildingName',
            header: 'Parent Building',
            cell: ({ row }: any) => <span className="font-semibold text-slate-600 dark:text-slate-400">{row.original.buildingName}</span>
          },
          {
            accessorKey: 'capacity',
            header: 'Capacity',
            cell: ({ row }: any) => <span className="font-mono font-bold">{row.original.capacity || 0} Beds</span>
          },
          {
            accessorKey: 'roomsCount',
            header: 'Rooms Count',
            cell: ({ row }: any) => <span className="font-semibold">{row.original.roomsCount || 0} Rooms</span>
          },
          getActionColumn('floors')
        ] as ColumnDef<any, any>[];
      }

      return [
        {
          accessorKey: 'name',
          header: 'Building / Hall Name',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
        },
        {
          accessorKey: 'genderAllowed',
          header: 'Gender Category',
          cell: ({ row }: any) => {
            const gender = row.original.genderAllowed || 'male';
            return (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                gender === 'male' ? 'bg-blue-100 text-blue-800' : gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {gender}
              </span>
            );
          }
        },
        {
          accessorKey: 'totalBeds',
          header: 'Total Capacity',
          cell: ({ row }: any) => <span className="font-mono font-bold">{row.original.totalBeds || 0} Beds</span>
        },
        {
          accessorKey: 'occupiedBeds',
          header: 'Occupied',
          cell: ({ row }: any) => {
            const occupied = row.original.occupiedBeds || 0;
            const total = row.original.totalBeds || 1;
            return (
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {occupied} Beds ({Math.round((occupied / total) * 100)}%)
              </span>
            );
          }
        },
        {
          accessorKey: 'totalRooms',
          header: 'Rooms Count',
          cell: ({ row }: any) => <span className="font-semibold">{row.original.totalRooms || 0} Rooms</span>
        },
        getActionColumn('buildings')
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'waiting-list') {
      return [
        {
          accessorKey: 'name',
          header: 'Scholar Name',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
        },
        {
          accessorKey: 'gender',
          header: 'Gender',
          cell: ({ row }: any) => (
            <span className="text-slate-600 dark:text-slate-400 font-semibold">{row.original.gender}</span>
          )
        },
        {
          accessorKey: 'grade',
          header: 'Program / Grade',
          cell: ({ row }: any) => <span className="text-slate-600 dark:text-slate-400 font-semibold">{row.original.grade}</span>
        },
        {
          accessorKey: 'waitingDays',
          header: 'Waiting Period',
          cell: ({ row }: any) => <span className="font-bold text-indigo-600">{row.original.waitingDays} Days</span>
        },
        {
          id: 'action',
          header: 'Action',
          cell: ({ row }: any) => (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-2xs"
            >
              Assign Bed
            </button>
          )
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'deposits') {
      return [
        {
          accessorKey: 'studentName',
          header: 'Scholar Name',
          cell: ({ row }: any) => <span className="font-bold text-slate-900 dark:text-white">{row.original.studentName}</span>
        },
        {
          accessorKey: 'roomNumber',
          header: 'Room / Suite',
          cell: ({ row }: any) => <span className="font-semibold text-slate-600 dark:text-slate-400">{row.original.buildingName} - Suite {row.original.roomNumber}</span>
        },
        {
          accessorKey: 'securityDeposit',
          header: 'Security Deposit (GL 2050)',
          cell: ({ row }: any) => <span className="font-mono font-bold text-slate-900 dark:text-white">{hostelSettings.currency} {row.original.securityDeposit?.toFixed(2)}</span>
        },
        {
          accessorKey: 'status',
          header: 'Deposit Status',
          cell: ({ row }: any) => (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              row.original.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {row.original.status === 'active' ? 'Held (GL 2050)' : 'Released / Refunded'}
            </span>
          )
        },
        {
          id: 'action',
          header: 'Action',
          cell: ({ row }: any) => {
            const a = row.original;
            return a.status === 'active' ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await hostelService.vacateBed(a.id, a.studentName);
                  loadData();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-2xs"
              >
                Refund Deposit
              </button>
            ) : <span className="text-[10px] text-slate-400">Settled</span>;
          }
        }
      ] as ColumnDef<any, any>[];
    }

    if (activeTab === 'attendance') {
      return [
        {
          accessorKey: 'studentName',
          header: 'Scholar & ID',
          cell: ({ row }: any) => (
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white block">{row.original.studentName}</span>
              <span className="font-mono text-[10px] text-slate-500">{row.original.schoolId}</span>
            </div>
          )
        },
        {
          accessorKey: 'date',
          header: 'Date',
          cell: ({ row }: any) => <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-xs">{row.original.date}</span>
        },
        {
          accessorKey: 'attendanceStatus',
          header: 'Status',
          cell: ({ row }: any) => {
            const s = row.original.attendanceStatus;
            const cfg: Record<string, string> = {
              present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
              absent: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
              late: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
              excused: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
            };
            return (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${cfg[s] || 'bg-slate-100 text-slate-700'}`}>
                {s}
              </span>
            );
          }
        },
        {
          accessorKey: 'checkInTime',
          header: 'Check-In Time',
          cell: ({ row }: any) => (
            <span className="font-mono text-xs text-slate-500">{row.original.checkInTime || '—'}</span>
          )
        },
        {
          accessorKey: 'notes',
          header: 'Notes',
          cell: ({ row }: any) => (
            <span className="text-slate-500 dark:text-slate-400 italic text-xs">{row.original.notes || '—'}</span>
          )
        },
        {
          id: 'attendance-actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const item = row.original;
            return (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {item.attendanceStatus !== 'present' && (
                  <button
                    onClick={async () => {
                      try {
                        const docId = item.documentId || item.id;
                        await apiClient.put(`/hostel-attendances/${docId}`, {
                          data: { attendanceStatus: 'present', checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                        });
                        toast.success('Marked as Present');
                        loadData();
                      } catch {
                        toast.error('Failed to update attendance');
                      }
                    }}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs"
                  >
                    Present
                  </button>
                )}
                <button
                  onClick={() => {
                    setCrudModalType('attendance');
                    setSelectedEditItem(item);
                    setIsCrudModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Delete this attendance record?')) {
                      try {
                        const docId = item.documentId || item.id;
                        await apiClient.delete(`/hostel-attendances/${docId}`);
                        toast.success('Attendance record deleted.');
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete record.');
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
                >
                  Delete
                </button>
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }


    if (activeTab === 'wardens') {
      return [
        {
          accessorKey: 'name',
          header: 'Warden Name & Role',
          cell: ({ row }: any) => {
            const w = row.original;
            const roleLabel = w.role === 'chief_warden' ? 'Chief Warden' : w.role === 'assistant_warden' ? 'Asst. Warden' : w.role === 'resident_assistant' ? 'Resident Asst.' : 'Warden';
            return (
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">{w.name}</span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{roleLabel}</span>
              </div>
            );
          }
        },
        {
          accessorKey: 'building',
          header: 'Assigned Building',
          cell: ({ row }: any) => <span className="font-semibold text-slate-600 dark:text-slate-400">{row.original.building}</span>
        },
        {
          accessorKey: 'dutyShift',
          header: 'Duty Shift',
          cell: ({ row }: any) => {
            const shift = row.original.dutyShift || 'full_day';
            const shiftLabel: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night', full_day: 'Full Day' };
            const shiftColor: Record<string, string> = { morning: 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400', afternoon: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20', evening: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20', night: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', full_day: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' };
            return (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shiftColor[shift] || shiftColor.full_day}`}>
                {shiftLabel[shift] || shift}
              </span>
            );
          }
        },
        {
          accessorKey: 'phone',
          header: 'Phone / Contact',
          cell: ({ row }: any) => <span className="font-mono text-xs text-slate-500">{row.original.phone}</span>
        },
        {
          accessorKey: 'status',
          header: 'Duty Status',
          cell: ({ row }: any) => (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              row.original.status === 'On Duty' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {row.original.status}
            </span>
          )
        },
        {
          id: 'warden-actions',
          header: 'Actions',
          cell: ({ row }: any) => {
            const item = row.original;
            return (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setCrudModalType('wardens');
                    setSelectedEditItem({ ...item, employee: item.name, documentId: item.documentId });
                    setIsCrudModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to remove this warden?')) {
                      try {
                        const docId = item.documentId || item.id;
                        await apiClient.delete(`/hostel-wardens/${docId}`);
                        toast.success('Warden record deleted.');
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete warden record.');
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200/50 dark:border-rose-900/30"
                >
                  Delete
                </button>
              </div>
            );
          }
        }
      ] as ColumnDef<any, any>[];
    }


    return [] as ColumnDef<any, any>[];
  }, [activeTab, stats, buildingSubTab, roomSubTab, payments]);

  return (
    <EnterpriseModuleShell
      title="Hostel Operations Center"
      description=""
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Hostel & Boarding' }]}
      icon={<Home className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredData.length}
      recordLabel={
        activeTab === 'allocations' ? 'Bed Allocations' :
        activeTab === 'rooms' ? 'Rooms' :
        activeTab === 'gatepasses' ? 'Gate Passes' :
        activeTab === 'maintenance' ? 'Tickets' :
        activeTab === 'visitors' ? 'Visitors' : 'Fee Plans'
      }
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          {(activeTab === 'dashboard' || activeTab === 'allocations') && (
            <>
              {activeTab === 'dashboard' && (
                <button
                  onClick={() => setIsGuestModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>+ Guest Stay & Gate Pass</span>
                </button>
              )}
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Allocate Bed</span>
              </button>
            </>
          )}

          {['buildings', 'rooms', 'gatepasses', 'maintenance', 'visitors', 'feeplans', 'wardens', 'attendance'].includes(activeTab) && (
            <button
              onClick={() => {
                const modalType = activeTab === 'buildings' ? buildingSubTab :
                                  activeTab === 'rooms' ? roomSubTab : activeTab;
                setCrudModalType(modalType);
                setSelectedEditItem(null);
                setIsCrudModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all animate-in fade-in"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {activeTab === 'buildings' ? (buildingSubTab === 'floors' ? 'Add Floor' : 'Add Building') :
                 activeTab === 'rooms' ? (roomSubTab === 'beds' ? 'Add Bed' : 'Add Room') :
                 activeTab === 'gatepasses' ? 'Log Gate Pass' :
                 activeTab === 'maintenance' ? 'Log Repair Ticket' :
                 activeTab === 'visitors' ? 'Log Visitor' :
                 activeTab === 'feeplans' ? 'Create Fee Plan' :
                 activeTab === 'wardens' ? 'Add Warden' :
                 activeTab === 'attendance' ? 'Log Attendance' : 'Add Entry'}
              </span>
            </button>
          )}
        </div>
      }
    >

      {/* 6-Tab Selector Navigation Bar */}
      <div className="flex items-center gap-1.5 px-1 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-5xl overflow-x-auto no-scrollbar mb-6">
        {[
          { id: 'dashboard', label: 'Hostel Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
          { id: 'buildings', label: 'Buildings & Floors', icon: <Building className="w-3.5 h-3.5" /> },
          { id: 'rooms', label: 'Rooms & Beds', icon: <Bed className="w-3.5 h-3.5" /> },
          { id: 'allocations', label: 'Bed Allocations', icon: <ClipboardList className="w-3.5 h-3.5" /> },
          { id: 'waiting-list', label: 'Waiting List', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'feeplans', label: 'Fee Plans & Setup', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'deposits', label: 'Security Deposits', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'visitors', label: 'Visitor Logs', icon: <KeyRound className="w-3.5 h-3.5" /> },
          { id: 'gatepasses', label: 'Gate Passes', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
          { id: 'attendance', label: 'Attendance Logs', icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: 'wardens', label: 'Wardens & Duty', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'maintenance', label: 'Maintenance Tickets', icon: <Wrench className="w-3.5 h-3.5" /> },
          { id: 'settings', label: 'Reports & Settings', icon: <Settings className="w-3.5 h-3.5" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Section 6: Actionable Alerts */}
          <div className="grid grid-cols-1 gap-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                  alert.type === 'danger' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400' :
                  alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400' :
                  'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>

          {/* Section 1: Executive operational KPIs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Occupancy Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Occupancy</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{stats.occupied} / {stats.totalBeds} Beds</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                <span>{stats.vacant} Vacant • {stats.reserved} Reserved</span>
                <span className="text-indigo-600 font-bold">{stats.occupancyRate}% Rate</span>
              </div>
            </div>

            {/* Buildings Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Buildings Inventory</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{stats.buildingsCount} Active Halls</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                <span>{stats.floorsCount} Floors • {stats.roomsCount} Rooms</span>
              </div>
            </div>

            {/* Students Boarders Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Student Boarders</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{stats.currentBoarders} Scholars</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                <span>Pending Queue: {stats.pendingAllocationsCount}</span>
                <span className="text-emerald-600 font-bold">+{stats.checkInsToday} In / -{stats.checkOutsToday} Out</span>
              </div>
            </div>

            {/* Operations Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Operations & Security</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{stats.openTickets} Open Repairs</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                <span>{stats.visitorsInsideCount} Visitors • {stats.gatePassRequestsCount} Passes pending</span>
              </div>
            </div>
          </div>

          {/* Section 2 & 3: Heat Map and Buildings panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Occupancy Heat Map */}
            <div className="lg:col-span-1 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Occupancy Heat Map
                </h4>
                <div className="space-y-4">
                  {buildings.map((b) => {
                    const total = b.totalBeds || 0;
                    const occupied = b.occupiedBeds || 0;
                    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
                    return (
                      <div key={b.id}>
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                          <span>{b.name}</span>
                          <span>{occupied} / {total} ({rate}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {buildings.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No buildings registered yet.</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 mt-4 text-[11px] text-slate-500 font-medium">
                Live occupancy rate is computed across all {stats.totalBeds} bed records.
              </div>
            </div>

            {/* Buildings Panel */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Boarding Buildings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {buildings.slice(0, 4).map((b) => {
                    const total = b.totalBeds || 0;
                    const occupied = b.occupiedBeds || 0;
                    const vacant = Math.max(0, total - occupied);
                    return (
                      <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-3">
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">{b.name}</h5>
                        <p className="text-[11px] text-slate-500">{total} Beds • {occupied} Occupied • {vacant} Vacant</p>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setRoomSubTab('rooms');
                            setActiveTab('rooms');
                          }} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold">Inspect Rooms</button>
                          <button onClick={() => setActiveTab('wardens')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold">Wardens</button>
                        </div>
                      </div>
                    );
                  })}
                  {buildings.length === 0 && (
                    <p className="text-xs text-slate-500 italic col-span-2">No buildings registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Recent Allocations & Waiting List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Section 4: Recent Allocations Activity */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Today&apos;s Allocation Activity</h4>
              <div className="space-y-3">
                {allocations.slice(0, 4).map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-[10px]">
                        {a.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{a.studentName}</p>
                        <span className="text-[10px] text-slate-500 font-mono">Room {a.roomNumber} ({a.bedNumber})</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      a.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {a.status === 'active' ? 'Allocated' : 'Vacated'}
                    </span>
                  </div>
                ))}
                {allocations.length === 0 && (
                  <p className="text-xs text-slate-500 italic p-3 text-center">No allocations logged today.</p>
                )}
              </div>
            </div>

            {/* Section 5: Waiting List */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Admission Waiting List</h4>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">{waitingListMapped.length} Students</span>
                </div>
                <div className="space-y-3">
                  {waitingListMapped.map((item) => (
                    <div key={item.name} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">
                          {item.photo}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <span className="text-[10px] text-slate-500">{item.gender} • {item.grade} • Waiting {item.waitingDays} Days</span>
                        </div>
                      </div>
                      <button onClick={() => setIsWizardOpen(true)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-2xs">
                        Assign Bed
                      </button>
                    </div>
                  ))}
                  {waitingListMapped.length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 text-center">All scholars are currently allocated beds.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 & 8: Financial Summary & Maintenance Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Section 7: Financial Summary */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Hostel Financial Ledger Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Accommodation Revenue</span>
                  <p className="text-sm font-black text-emerald-600 mt-1">{hostelSettings.currency} {stats.collectedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Deposits Liability</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white mt-1">{hostelSettings.currency} {stats.depositsHeld.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Receivables Dues</span>
                  <p className="text-sm font-black text-rose-600 mt-1">{hostelSettings.currency} {stats.outstandingFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Damage Charges Invoiced</span>
                  <p className="text-sm font-black text-amber-600 mt-1">{hostelSettings.currency} 0.00</p>
                </div>
              </div>
            </div>

            {/* Section 8: Maintenance Dashboard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Repairs & Maintenance Center</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Open Tickets</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1">{stats.openTickets}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Plumbing</span>
                  <p className="text-base font-black text-rose-600 mt-1">{maintenanceTickets.filter(t => t.category === 'plumbing' && t.status === 'open').length}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Electrical</span>
                  <p className="text-base font-black text-amber-600 mt-1">{maintenanceTickets.filter(t => t.category === 'electrical' && t.status === 'open').length}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Cleaning</span>
                  <p className="text-base font-black text-emerald-600 mt-1">{maintenanceTickets.filter(t => t.category === 'cleaning' && t.status === 'open').length}</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('maintenance')} className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all mt-4">
                View Maintenance Log
              </button>
            </div>
          </div>

          {/* Section 9, 10 & 11: Gate, Visitor, and Warden Dashboards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Gate Pass Dashboard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Gate Pass Activity</h4>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Total Active</span> <span className="font-bold text-slate-900 dark:text-white">{gatePasses.length}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Approved Exits</span> <span className="font-bold text-emerald-600">{gatePasses.filter(g => g.status === 'approved').length}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Pending Warden</span> <span className="font-bold text-amber-600">{stats.gatePassRequestsCount}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Expired/Late</span> <span className="font-bold text-rose-600">{stats.curfewViolations}</span>
                </div>
              </div>
              <button onClick={() => setActiveTab('gatepasses')} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all mt-3">
                Manage Gate Passes
              </button>
            </div>

            {/* Visitor Dashboard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Visitor Logs</h4>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Visitors Inside</span> <span className="font-bold text-indigo-600">{stats.visitorsInsideCount}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Expected Guests</span> <span className="font-bold text-slate-900 dark:text-white">{visitors.filter(v => v.status === 'approved' && !v.checkIn).length}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Checked Out</span> <span className="font-bold text-slate-500">{visitors.filter(v => v.checkOut).length}</span>
                </div>
              </div>
              <button onClick={() => setActiveTab('visitors')} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all mt-7">
                Visitor Registry
              </button>
            </div>

            {/* Warden Dashboard */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 font-sans">Active Chief Wardens</h4>
              <div className="space-y-2.5">
                {wardensMapped.slice(0, 3).map((w) => (
                  <div key={w.name} className="flex justify-between items-center py-1 border-b last:border-0 border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{w.name}</p>
                      <span className="text-[10px] text-slate-500">{w.building} • {w.phone}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      w.status === 'On Duty' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
                {wardensMapped.length === 0 && (
                  <p className="text-xs text-slate-500 italic p-3 text-center">No wardens registered.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 12: Bed Occupancy Grid Visuals */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Interactive Bed Occupancy Layout</h4>
              {rooms.length > 0 && (
                <select
                  value={selectedVisualRoomId || rooms[0].id}
                  onChange={(e) => setSelectedVisualRoomId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.buildingName})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bedGridVisuals.map((bed) => (
                <div key={bed.name} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{bed.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      bed.status === 'occupied' ? 'bg-rose-500' : bed.status === 'maintenance' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 font-semibold">
                    {bed.occupier}
                  </p>
                </div>
              ))}
              {bedGridVisuals.length === 0 && (
                <p className="text-xs text-slate-500 italic col-span-4 text-center p-4">No rooms or beds configured.</p>
              )}
            </div>
          </div>

          {/* Section 13 & 15: Financial Timeline & Recent Audit Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Section 13: Financial Timeline */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Financial Transaction Stream</h4>
              <div className="space-y-3.5 border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-1">
                {financialTimelineMapped.map((p) => (
                  <div key={p.id} className="relative">
                    <span className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full ${p.type === 'plus' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                    <span className={`font-mono font-extrabold ${p.type === 'plus' ? 'text-emerald-600' : 'text-rose-600'}`}>{p.amount}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{p.time}</span>
                  </div>
                ))}
                {financialTimelineMapped.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No financial activities recorded.</p>
                )}
              </div>
            </div>

            {/* Section 15: Recent Activity Timeline */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">System Operational Log Feed</h4>
              <div className="space-y-3.5 border-l-2 border-indigo-500 pl-4 ml-1">
                {auditLogsMapped.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <p className="font-bold text-slate-900 dark:text-white">{log.action}</p>
                    <span className="text-[10px] text-slate-500 block">{log.time} • By {log.by} ({log.notes})</span>
                  </div>
                ))}
                {auditLogsMapped.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No system events logged.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 14: Quick Actions Grid */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">Hostel ERP Quick Task Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button onClick={() => setIsWizardOpen(true)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Allocate Bed
              </button>
              <button onClick={() => setActiveTab('rooms')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Room Inventory
              </button>
              <button onClick={() => setIsGuestModalOpen(true)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Visitor Portal
              </button>
              <button onClick={() => setActiveTab('gatepasses')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Gate Passes
              </button>
              <button onClick={() => setActiveTab('maintenance')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Repairs Ticket
              </button>
            </div>
          </div>

        </div>
      ) : activeTab === 'settings' ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-4xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Hostel Policy & General Ledger Configuration</h4>
              <p className="text-xs text-slate-500">Configure global boarding parameters, curfews, and automatic GL journal account codes.</p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem('hostelSettings', JSON.stringify(hostelSettings));
            toast.success('Hostel ERP configuration saved successfully.');
          }} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Active Boarding Academic Year</label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold">
                  <option>AY 2026/2027 (Current Term)</option>
                  <option>AY 2027/2028 (Next Session)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Curfew Lockout Deadline</label>
                <input
                  type="text"
                  value={hostelSettings.curfew}
                  onChange={(e) => setHostelSettings({ ...hostelSettings, curfew: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Visitor Access Window</label>
                <input
                  type="text"
                  value={hostelSettings.visitorAccess}
                  onChange={(e) => setHostelSettings({ ...hostelSettings, visitorAccess: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Standard Security Deposit Fee ({hostelSettings.currency})</label>
                <input
                  type="number"
                  value={hostelSettings.standardDeposit}
                  onChange={(e) => setHostelSettings({ ...hostelSettings, standardDeposit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Display Currency</label>
                <input
                  type="text"
                  required
                  list="hostel-currencies"
                  value={hostelSettings.currency}
                  onChange={(e) => setHostelSettings({ ...hostelSettings, currency: e.target.value.toUpperCase() })}
                  placeholder="e.g. USD, GNF, LD, NGN"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
                <datalist id="hostel-currencies">
                  <option value="USD" />
                  <option value="LD" />
                  <option value="GNF" />
                  <option value="NGN" />
                  <option value="EUR" />
                </datalist>
                <p className="text-[10px] text-slate-400">Select or type any custom currency symbol or code.</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mb-3">Finance General Ledger Linkage</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Student AR Account (debit)</label>
                  <input type="text" defaultValue="GL 1100" disabled className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Accommodation Rev (credit)</label>
                  <input type="text" defaultValue="GL 4020" disabled className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Deposit Liability (credit)</label>
                  <input type="text" defaultValue="GL 2050" disabled className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Cash / Vault (credit)</label>
                  <input type="text" defaultValue="GL 1010" disabled className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer">
                Save Settings
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <EnterpriseToolbar
            searchQuery={query}
            onSearchChange={setQuery}
            searchPlaceholder={
              activeTab === 'allocations' ? 'Search allocations by scholar name, room number, school ID...' :
              activeTab === 'rooms' ? (roomSubTab === 'beds' ? 'Search beds by number or room/building...' : 'Search rooms by number or building name...') :
              activeTab === 'gatepasses' ? 'Search gate passes by scholar name or reason...' :
              activeTab === 'maintenance' ? 'Search tickets by category or description...' :
              activeTab === 'visitors' ? 'Search visitors by guest name or purpose...' :
              activeTab === 'feeplans' ? 'Search fee plans by name...' :
              activeTab === 'buildings' ? (buildingSubTab === 'floors' ? 'Search floors by name or building...' : 'Search buildings by name...') :
              activeTab === 'waiting-list' ? 'Search waitlisted students by name...' :
              activeTab === 'deposits' ? 'Search security deposit ledgers by student name...' :
              activeTab === 'attendance' ? 'Search attendance logs by student name...' :
              activeTab === 'wardens' ? 'Search wardens by name or building...' : 'Search records...'
            }
            density={density}
            onDensityChange={setDensity}
            onRefresh={loadData}
          />

          {activeTab === 'buildings' && (
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl w-fit animate-in fade-in">
              <button
                onClick={() => setBuildingSubTab('buildings')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  buildingSubTab === 'buildings'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Buildings List
              </button>
              <button
                onClick={() => setBuildingSubTab('floors')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  buildingSubTab === 'floors'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Floors Configuration
              </button>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl w-fit animate-in fade-in">
              <button
                onClick={() => setRoomSubTab('rooms')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roomSubTab === 'rooms'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Rooms Inventory
              </button>
              <button
                onClick={() => setRoomSubTab('beds')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roomSubTab === 'beds'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Beds List
              </button>
            </div>
          )}

          <EnterpriseDataGrid
            data={filteredData}
            columns={columns}
            isLoading={loading}
            density={density}
            onRowInspect={
              activeTab === 'allocations' ? (row) => setSelectedAllocation(row) :
              activeTab === 'visitors' ? (row) => setSelectedVisitor(row) :
              undefined
            }
          />
        </div>
      )}

      {/* 5-Step Guided Allocation Wizard */}
      <HostelAllocationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(newAlloc) => {
          setAllocations(prev => [newAlloc, ...prev]);
          loadData();
        }}
      />

      {/* Guest & Visitor Portal Modal */}
      <GuestHostelModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* 11-Tab Operational Inspector Drawer */}
      <HostelInspectionDrawer
        isOpen={!!selectedAllocation}
        onClose={() => {
          setSelectedAllocation(null);
          loadData();
        }}
        allocation={selectedAllocation}
      />

      {/* Visitor Profile Inspector Drawer */}
      <VisitorInspectionDrawer
        isOpen={!!selectedVisitor}
        onClose={() => {
          setSelectedVisitor(null);
          loadData();
        }}
        visitor={selectedVisitor}
        onSuccess={loadData}
      />

      {/* Dynamic CRUD Modal */}
      <HostelCrudModal
        isOpen={isCrudModalOpen}
        onClose={() => {
          setIsCrudModalOpen(false);
          setSelectedEditItem(null);
        }}
        onSuccess={() => {
          loadData();
        }}
        type={crudModalType}
        editItem={selectedEditItem}
      />
    </EnterpriseModuleShell>
  );
}
