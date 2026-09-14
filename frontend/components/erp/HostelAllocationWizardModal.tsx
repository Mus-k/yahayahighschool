/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, CheckCircle2, UserCheck, ShieldAlert, KeyRound, Building, Plus } from 'lucide-react';
import { hostelService } from '@/services/hostel.service';
import type { HostelBedAllocation } from '@/types/enterprise.types';
import { toast } from 'sonner';

interface HostelAllocationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAllocation: HostelBedAllocation) => void;
}

export function HostelAllocationWizardModal({ isOpen, onClose, onSuccess }: HostelAllocationWizardModalProps) {
  const [allocationNumber, setAllocationNumber] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  
  // Set fee states as strings so the user can easily delete, backspace, and edit values
  const [termFeeUSD, setTermFeeUSD] = useState('250.00');
  const [depositUSD, setDepositUSD] = useState('50.00');
  const [status, setStatus] = useState<'active' | 'transferred' | 'vacated' | 'checked_out'>('active');

  // Assigned room states
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [beds, setBeds] = useState<any[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');

  // Master lists
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize and load master data with no pagination limit to fetch all records
  useEffect(() => {
    if (!isOpen) return;

    // Generate doc number
    setAllocationNumber('HST-2026-' + Math.floor(1000 + Math.random() * 9000));

    const loadInitialData = async () => {
      try {
        const { apiClient } = await import('@/services/api.service');
        
        // Load active students - bypass default pagination limits
        const stdRes = await apiClient.get('/students?filters[enrollmentStatus][$eq]=active&pagination[limit]=-1&populate=*');
        const students = stdRes.data?.data || [];
        setStudentsList(students);
        if (students[0]) {
          setSelectedStudentId(students[0].documentId || students[0].id);
        }

        // Load buildings
        const blds = await hostelService.getBuildings();
        setBuildings(blds);
        if (blds[0]) {
          setSelectedBuildingId(blds[0].id);
        }
      } catch (err) {
        console.warn('Failed to load allocation form master lists:', err);
      }
    };

    loadInitialData();
  }, [isOpen]);

  // Load floors dynamically based on building
  useEffect(() => {
    const loadFloors = async () => {
      if (!selectedBuildingId) {
        setFloors([]);
        setSelectedFloorId('');
        return;
      }
      try {
        const { apiClient } = await import('@/services/api.service');
        const res = await apiClient.get(`/hostel-floors?filters[building][documentId][$eq]=${selectedBuildingId}&pagination[limit]=-1&populate=*`);
        const flrs = res.data?.data || [];
        setFloors(flrs);
        if (flrs[0]) {
          setSelectedFloorId(flrs[0].documentId || flrs[0].id);
        } else {
          setSelectedFloorId('');
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadFloors();
  }, [selectedBuildingId]);

  // Load rooms dynamically based on building and floor selection
  useEffect(() => {
    const loadRooms = async () => {
      if (!selectedBuildingId) {
        setRooms([]);
        setSelectedRoomId('');
        return;
      }
      try {
        const { apiClient } = await import('@/services/api.service');
        const filterPart = selectedFloorId 
          ? `&filters[floor][documentId][$eq]=${selectedFloorId}` 
          : '';
        const res = await apiClient.get(`/hostel-rooms?filters[building][documentId][$eq]=${selectedBuildingId}${filterPart}&pagination[limit]=-1&populate=*`);
        const rms = res.data?.data || [];
        setRooms(rms);
        if (rms[0]) {
          setSelectedRoomId(rms[0].documentId || rms[0].id);
        } else {
          setSelectedRoomId('');
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadRooms();
  }, [selectedBuildingId, selectedFloorId]);

  // Load beds dynamically based on room selection
  useEffect(() => {
    const loadBeds = async () => {
      if (!selectedRoomId) {
        setBeds([]);
        setSelectedBedId('');
        return;
      }
      try {
        const { apiClient } = await import('@/services/api.service');
        const res = await apiClient.get(`/hostel-beds?filters[room][documentId][$eq]=${selectedRoomId}&pagination[limit]=-1&populate=*`);
        const bds = res.data?.data || [];
        setBeds(bds);
        if (bds[0]) {
          setSelectedBedId(bds[0].documentId || bds[0].id);
        } else {
          setSelectedBedId('');
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadBeds();
  }, [selectedRoomId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student.');
      return;
    }
    if (!selectedBedId) {
      toast.error('Please select a room and bed.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find selected details
      const studentObj = studentsList.find(s => (s.documentId || s.id) === selectedStudentId);
      const buildingObj = buildings.find(b => b.id === selectedBuildingId);
      const roomObj = rooms.find(r => (r.documentId || r.id) === selectedRoomId);
      const bedObj = beds.find(b => (b.documentId || b.id) === selectedBedId);

      const allocation = await hostelService.allocateBedWithWizard({
        studentId: selectedStudentId,
        studentName: [studentObj?.firstName, studentObj?.lastName].filter(Boolean).join(' ') || 'Student Scholar',
        schoolId: studentObj?.schoolId || studentObj?.admissionNumber || 'AC0000000',
        gender: studentObj?.gender || 'male',
        programName: studentObj?.programs?.[0]?.title || 'Grade 9 STEM',
        guardianName: studentObj?.parents?.[0]?.name || 'Guardian',
        guardianPhone: studentObj?.parents?.[0]?.phone || '+231 886 000 000',
        buildingName: buildingObj?.name || 'Boarding Hall',
        roomNumber: roomObj?.roomNumber || '101',
        bedNumber: bedObj?.bedNumber || 'Bed A',
        termFee: Number(termFeeUSD) || 0,
        securityDeposit: Number(depositUSD) || 0,
        checkInDate,
        academicYear,
        medicalInfo: {
          allergies: studentObj?.medicalInfo?.[0]?.allergies || [],
          chronicConditions: [],
          emergencyCarePlan: 'Standard Boarding Protocol',
          isolationRequired: false,
          hospitalVisitsCount: 0,
          doctorContact: '+231 886 900 111'
        }
      });

      // Update additional fields (custom checkout date, status, custom alloc code)
      const { apiClient } = await import('@/services/api.service');
      await apiClient.put(`/hostel-allocations/${allocation.id}`, {
        data: {
          allocationNumber,
          checkInDate,
          checkOutDate: checkOutDate || null,
          status: status,
          academicYear
        }
      });

      toast.success('Bed Allocation saved successfully!');
      onSuccess({
        ...allocation,
        allocationNumber,
        checkInDate,
        checkOutDate,
        status,
        academicYear
      });
      onClose();
    } catch (err) {
      toast.error('Failed to save bed allocation.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create Hostel Bed Allocation</h3>
              <p className="text-xs text-slate-500">SIS Student Linkage & Automatic Ledger Invoicing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 overflow-y-auto pr-1 scrollbar-thin flex-1 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Allocation Number *</label>
              <input
                type="text"
                required
                value={allocationNumber}
                onChange={(e) => setAllocationNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Student / Scholar (Relation) *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                {studentsList.map((s) => (
                  <option key={s.id} value={s.documentId || s.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">
                    {s.firstName} {s.lastName} ({s.schoolId || s.admissionNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Check-in Date *</label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Check-out</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year *</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="active" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Active</option>
                <option value="checked_out" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Checked Out</option>
                <option value="vacated" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Vacated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Accommodation Term Fee ($) *</label>
              <input
                type="text"
                required
                value={termFeeUSD}
                onChange={(e) => setTermFeeUSD(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Security Deposit ($) *</label>
              <input
                type="text"
                required
                value={depositUSD}
                onChange={(e) => setDepositUSD(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section Divider */}
          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
            <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-2">
              ASSIGNED ROOM / ACCOMMODATION SCOPE
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Building *</label>
              <select
                required
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor *</label>
              <select
                required
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Select Floor...</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.documentId || f.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">
                    {f.floorName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room *</label>
              <select
                required
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Select Room...</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.documentId || r.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">
                    Room {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bed *</label>
              <select
                required
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                <option value="" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Select Bed...</option>
                {beds.map((b) => (
                  <option key={b.id} value={b.documentId || b.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">
                    {b.bedNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Allocation...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
