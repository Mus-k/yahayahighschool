'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus, MapPin, Users, Fuel, Plus, Eye, Navigation, ShieldCheck, FileText,
  X, Clock, AlertTriangle, Printer, TrendingUp, Gauge, User, DollarSign, RefreshCw
} from 'lucide-react';
import { transportService } from '@/services/transport.service';
import { apiClient } from '@/services/api.service';
import type { TransportVehicle, TransportRoute, StudentTransportAssignment, FuelLog } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modal toggle states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentTransportAssignment | null>(null);

  // Local fuel logs history state to show in the inspect card
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([
    {
      id: 'FL-01',
      vehiclePlate: 'LBR-BUS-104',
      driverName: 'Mohammed Kanneh',
      liters: 45,
      costPerLiter: 1.35,
      totalCost: 60.75,
      odometerReading: 45210,
      date: '2026-08-22'
    },
    {
      id: 'FL-02',
      vehiclePlate: 'LBR-BUS-108',
      driverName: 'Abu Bakr Sillah',
      liters: 50,
      costPerLiter: 1.35,
      totalCost: 67.50,
      odometerReading: 38415,
      date: '2026-08-21'
    }
  ]);

  // Form states for Assign Route
  const [assignForm, setAssignForm] = useState({
    studentDocumentId: '',
    routeId: '',
    stopName: '',
    pickupTime: '07:15 AM',
    dropTime: '04:15 PM',
    termFee: ''
  });

  // Form states for Log Fuel
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    driverName: '',
    liters: '',
    costPerLiter: '1.35',
    odometerReading: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, r, a, sRes] = await Promise.all([
        transportService.getVehicles(),
        transportService.getRoutes(),
        transportService.getStudentAssignments(),
        apiClient.get('/students', { params: { 'pagination[limit]': 100 } })
      ]);
      setVehicles(v);
      setRoutes(r);
      setAssignments(a);
      setStudents(sRes.data?.data || []);
    } catch {
      toast.error('Failed to load transport fleet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      return !query || 
        a.studentName.toLowerCase().includes(query.toLowerCase()) || 
        a.routeName.toLowerCase().includes(query.toLowerCase()) ||
        a.stopName.toLowerCase().includes(query.toLowerCase());
    });
  }, [assignments, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalSeats = vehicles.reduce((sum, v) => sum + v.capacity, 0);
    const totalRevenue = assignments.reduce((sum, a) => sum + (a.termFee || 0), 0);

    return [
      {
        id: 'fleet_vehicles',
        title: 'Active Fleet Vehicles',
        value: `${vehicles.length} Buses`,
        subtitle: `${totalSeats} Total Passenger Seats`,
        trendDirection: 'up',
        icon: <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'active_routes',
        title: 'Active Shuttle Routes',
        value: `${routes.length} Routes`,
        subtitle: 'Covering Monrovia & Suburban Campuses',
        trendDirection: 'neutral',
        icon: <Navigation className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'transport_students',
        title: 'Assigned Scholars',
        value: assignments.length.toString(),
        subtitle: 'Automated GPS & Pickup Confirmation',
        trendDirection: 'up',
        icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'transport_revenue',
        title: 'Transport Revenue (Term)',
        value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtitle: 'Auto-Invoiced via Finance ERP',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [vehicles, routes, assignments]);

  // Form Handlers
  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    setAssignForm(prev => ({
      ...prev,
      routeId,
      termFee: route ? route.termFee.toString() : ''
    }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setFuelForm(prev => ({
      ...prev,
      vehicleId,
      driverName: vehicle?.assignedDriverName || ''
    }));
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { studentDocumentId, routeId, stopName, pickupTime, dropTime, termFee } = assignForm;
    if (!studentDocumentId || !routeId || !stopName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const student = students.find(s => s.documentId === studentDocumentId);
    const route = routes.find(r => r.id === routeId);

    if (!student || !route) {
      toast.error('Invalid student or route selected');
      return;
    }

    const feeAmount = parseFloat(termFee) || route.termFee;

    try {
      const newAssignment = await transportService.assignStudentToRoute(
        student.id,
        `${student.firstName} ${student.lastName}`,
        student.schoolId || `ST-${student.id}`,
        route.id,
        route.routeName,
        stopName,
        feeAmount
      );

      // Override schedule details with user inputs
      newAssignment.pickupTime = pickupTime;
      newAssignment.dropTime = dropTime;

      // Update local state list
      setAssignments(prev => [newAssignment, ...prev]);
      
      // Reset form
      setAssignForm({
        studentDocumentId: '',
        routeId: '',
        stopName: '',
        pickupTime: '07:15 AM',
        dropTime: '04:15 PM',
        termFee: ''
      });
      setShowAssignModal(false);
    } catch (err) {
      toast.error('Failed to create route assignment');
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { vehicleId, driverName, liters, costPerLiter, odometerReading } = fuelForm;
    if (!vehicleId || !liters || !odometerReading) {
      toast.error('Please fill in all required fields');
      return;
    }

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      toast.error('Invalid vehicle selected');
      return;
    }

    const litersNum = parseFloat(liters);
    const costNum = parseFloat(costPerLiter);
    const odoNum = parseInt(odometerReading);

    try {
      const newLog = await transportService.logFuelExpense(
        vehicle.plateNumber,
        driverName || vehicle.assignedDriverName || 'Unknown Driver',
        litersNum,
        costNum
      );
      
      newLog.odometerReading = odoNum; // assign input odometer

      setFuelLogs(prev => [newLog, ...prev]);
      
      setFuelForm({
        vehicleId: '',
        driverName: '',
        liters: '',
        costPerLiter: '1.35',
        odometerReading: ''
      });
      setShowFuelModal(false);
    } catch (err) {
      toast.error('Failed to log fuel expense');
    }
  };

  const handleToggleStatus = (assignmentId: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const nextStatus = a.status === 'active' ? 'suspended' : 'active';
        toast.success(`Assignment status updated to: ${nextStatus}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
    setSelectedAssignment(prev => {
      if (prev && prev.id === assignmentId) {
        return { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' };
      }
      return prev;
    });
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'assignmentNumber',
        header: 'Assignment & Scholar',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{a.assignmentNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm">
                {a.studentName}
              </p>
              <span className="font-mono text-xs text-slate-500">{a.schoolId}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'routeName',
        header: 'Route & Bus Stop',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.routeName}</span>
            <span className="text-xs text-sky-600 font-bold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> Stop: {row.original.stopName}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'pickupTime',
        header: 'Schedule (Pickup / Drop)',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold block">
            {row.original.pickupTime} / {row.original.dropTime}
          </span>
        )
      },
      {
        accessorKey: 'termFee',
        header: 'Transport Fee',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">${row.original.termFee.toFixed(2)} / term</span>
            <span className="text-[11px] text-slate-500">Invoice: {row.original.invoiceId || 'N/A'}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAssignment(row.original);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            Inspect
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Transport & Fleet Logistics ERP"
      description="School shuttle route management, student pickup/drop manifests, fleet maintenance, fuel logs, and automated Finance ERP transport fee billing."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Transport Management' }]}
      icon={<Bus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredAssignments.length}
      recordLabel="Route Assignments"
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFuelModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Log Fuel</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Assign Route</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search transport assignments by student name, route, stop..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredAssignments}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedAssignment(row)}
      />

      {/* ─── MODAL 1: Assign Route ─── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Assign Student to Shuttle Route</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Select Scholar *</label>
                <select
                  value={assignForm.studentDocumentId}
                  onChange={e => setAssignForm(prev => ({ ...prev, studentDocumentId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.documentId}>
                      {s.firstName} {s.lastName} ({s.schoolId || `ID ${s.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Select Route *</label>
                <select
                  value={assignForm.routeId}
                  onChange={e => handleRouteChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose route...</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({r.routeCode}) - ${r.termFee}/term
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Bus Stop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Duala Market Stop, 12th St Junction"
                  value={assignForm.stopName}
                  onChange={e => setAssignForm(prev => ({ ...prev, stopName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Pickup Time</label>
                  <input
                    type="text"
                    value={assignForm.pickupTime}
                    onChange={e => setAssignForm(prev => ({ ...prev, pickupTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Drop-Off Time</label>
                  <input
                    type="text"
                    value={assignForm.dropTime}
                    onChange={e => setAssignForm(prev => ({ ...prev, dropTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Term Fee ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={assignForm.termFee}
                    onChange={e => setAssignForm(prev => ({ ...prev, termFee: e.target.value }))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Save triggers immediate integration with Finance ERP to auto-generate the student transport invoice.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer border-none"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Log Fuel ─── */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Log Vehicle Fuel & Expense Claims</h3>
              <button onClick={() => setShowFuelModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleFuelSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Select Vehicle *</label>
                <select
                  value={fuelForm.vehicleId}
                  onChange={e => handleVehicleChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose shuttle bus...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver's name..."
                  value={fuelForm.driverName}
                  onChange={e => setFuelForm(prev => ({ ...prev, driverName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Liters *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45"
                    value={fuelForm.liters}
                    onChange={e => setFuelForm(prev => ({ ...prev, liters: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-905 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Cost per Liter ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.35"
                    value={fuelForm.costPerLiter}
                    onChange={e => setFuelForm(prev => ({ ...prev, costPerLiter: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-905 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Odometer Reading (KM) *</label>
                <input
                  type="number"
                  placeholder="e.g. 45210"
                  value={fuelForm.odometerReading}
                  onChange={e => setFuelForm(prev => ({ ...prev, odometerReading: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-905 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {fuelForm.liters && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-250/30 text-xs font-bold text-amber-700 dark:text-amber-400">
                  Total Calculated Expense Cost: ${(parseFloat(fuelForm.liters) * parseFloat(fuelForm.costPerLiter || '0')).toFixed(2)}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer border-none"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Detailed Inspect Assignment ─── */}
      {selectedAssignment && (() => {
        const route = routes.find(r => r.id === selectedAssignment.routeId);
        const vehicle = vehicles.find(v => v.id === route?.vehicleId || v.plateNumber === route?.vehiclePlate);
        
        // Filter fuel logs matching this specific vehicle
        const matchingFuelLogs = fuelLogs.filter(log => log.vehiclePlate === (vehicle?.plateNumber || route?.vehiclePlate));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transport Clearance manifest</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                    {selectedAssignment.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedAssignment.schoolId} · Doc ID: {selectedAssignment.assignmentNumber}</p>
                </div>
                <button onClick={() => setSelectedAssignment(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                
                {/* Visual Status grid */}
                <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assignment Status</span>
                    <div><StatusBadge status={selectedAssignment.status} size="sm" /></div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Term Fee</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm block">${selectedAssignment.termFee.toFixed(2)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Finance Reference</span>
                    <span className="font-mono font-bold text-slate-905 dark:text-white block truncate">{selectedAssignment.invoiceId || 'N/A'}</span>
                  </div>
                </div>

                {/* Section 1: Route details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" /> Route Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Route Name</span>
                      <p className="text-slate-900 dark:text-white font-bold">{selectedAssignment.routeName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Bus Stop Point</span>
                      <p className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" /> {selectedAssignment.stopName}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Pickup Schedule</span>
                      <p className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {selectedAssignment.pickupTime}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Drop-off Schedule</span>
                      <p className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {selectedAssignment.dropTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Vehicle / Driver */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Bus className="w-4 h-4" /> Shuttle Bus & Driver Spec
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Vehicle Assigned</span>
                      <p className="text-slate-900 dark:text-white font-bold">{vehicle?.model || 'Nissan Civilian Bus'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">License Plate</span>
                      <p className="text-slate-900 dark:text-white font-mono font-black">{vehicle?.plateNumber || route?.vehiclePlate || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Assigned Driver</span>
                      <p className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {vehicle?.assignedDriverName || route?.driverName || 'Unknown Driver'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">GPS Status / Tracking</span>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        {vehicle?.currentGpsLocation || 'On Route Shuttling'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Fuel Logging history (fleet audit trail) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4" /> Vehicle Fuel Audit Trail
                  </h4>
                  {matchingFuelLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl font-normal">
                      No fuel logs recorded for this bus.
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Liters</th>
                            <th className="p-2.5">Cost/L</th>
                            <th className="p-2.5">Total Cost</th>
                            <th className="p-2.5">Odometer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {matchingFuelLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="p-2.5 font-mono">{log.date}</td>
                              <td className="p-2.5">{log.liters}L</td>
                              <td className="p-2.5">${log.costPerLiter.toFixed(2)}</td>
                              <td className="p-2.5 font-bold text-slate-905 dark:text-white">${log.totalCost.toFixed(2)}</td>
                              <td className="p-2.5 font-mono">{log.odometerReading?.toLocaleString('en-US') || 'N/A'} KM</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(selectedAssignment.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      selectedAssignment.status === 'active'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-250/30'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-250/30'
                    }`}
                  >
                    {selectedAssignment.status === 'active' ? 'Suspend Assignment' : 'Re-Activate Assignment'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer border-none"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </EnterpriseModuleShell>
  );
}
