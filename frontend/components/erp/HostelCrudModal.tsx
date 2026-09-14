'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';

interface HostelCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: string; // 'buildings' | 'floors' | 'rooms' | 'beds' | 'gatepasses' | 'maintenance' | 'visitors' | 'feeplans' | 'wardens' | 'attendance'
  editItem?: any; // If present, we are editing
}

export function HostelCrudModal({ isOpen, onClose, onSuccess, type, editItem }: HostelCrudModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buildingsList, setBuildingsList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [floorsList, setFloorsList] = useState<any[]>([]);
  const [bedsList, setBedsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  const getEndpoint = () => {
    switch (type) {
      case 'buildings': return '/hostel-buildings';
      case 'floors': return '/hostel-floors';
      case 'rooms': return '/hostel-rooms';
      case 'beds': return '/hostel-beds';
      case 'gatepasses': return '/hostel-gate-passs';
      case 'maintenance': return '/hostel-maintenance-tickets';
      case 'visitors': return '/hostel-visitors';
      case 'feeplans': return '/hostel-fee-plans';
      case 'wardens': return '/hostel-wardens';
      case 'attendance': return '/hostel-attendances';
      default: return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch dynamic relations lists
      apiClient.get('/hostel-buildings').then(res => {
        const data = res.data?.data || [];
        setBuildingsList(data);
        if (type === 'floors' && !editItem && data.length > 0) {
          setFormData((prev: any) => ({ ...prev, buildingId: data[0].documentId || data[0].id }));
        }
        if (type === 'wardens' && !editItem && data.length > 0) {
          setFormData((prev: any) => ({ ...prev, buildingId: data[0].documentId || data[0].id }));
        }
        if (type === 'rooms' && !editItem && data.length > 0) {
          setFormData((prev: any) => ({ ...prev, buildingId: data[0].documentId || data[0].id }));
        }
      }).catch(console.error);

      apiClient.get('/hostel-rooms').then(res => {
        const data = res.data?.data || [];
        setRoomsList(data);
        if (type === 'beds' && !editItem && data.length > 0) {
          setFormData((prev: any) => ({ ...prev, roomId: data[0].documentId || data[0].id }));
        }
      }).catch(console.error);

      apiClient.get('/hostel-floors?populate=*').then(res => {
        const rawFloors = res.data?.data || [];
        const mapped = rawFloors.map((f: any) => ({
          id: f.id,
          documentId: f.documentId,
          floorName: f.floorName,
          buildingName: f.building?.name || 'Main Hall'
        }));
        setFloorsList(mapped);
        if (type === 'rooms' && !editItem && mapped.length > 0) {
          setFormData((prev: any) => ({ ...prev, floorId: mapped[0].documentId || mapped[0].id }));
        }
      }).catch(console.error);

      apiClient.get('/hostel-beds?populate=*').then(res => {
        const rawBeds = res.data?.data || [];
        setBedsList(rawBeds);
      }).catch(console.error);

      apiClient.get('/students?filters[enrollmentStatus][$eq]=active&populate=*').then(res => {
        setStudentsList(res.data?.data || []);
      }).catch(console.error);
    }
  }, [isOpen, type, editItem]);

  useEffect(() => {
    if (editItem) {
      const initialData = { ...editItem };
      if (type === 'buildings') {
        initialData.genderCategory = editItem.gender === 'boys' ? 'male' : editItem.gender === 'girls' ? 'female' : 'co_ed';
      } else if (type === 'floors') {
        initialData.buildingId = editItem.building?.documentId || editItem.building?.id || '';
        initialData.roomsCount = editItem.roomsCount !== undefined ? editItem.roomsCount : (editItem.rooms?.length || 0);
      } else if (type === 'rooms') {
        initialData.buildingId = editItem.building?.documentId || editItem.building?.id || '';
        initialData.floorId = editItem.floor?.documentId || editItem.floor?.id || '';
      } else if (type === 'beds') {
        initialData.roomId = editItem.room?.documentId || editItem.room?.id || '';
      } else if (type === 'wardens') {
        initialData.name = editItem.employee || editItem.name || '';
        initialData.employee = initialData.name;
        initialData.phone = editItem.phone || '';
        initialData.email = editItem.email || '';
        initialData.status = editItem.status || 'active';
        initialData.dutyShift = editItem.dutyShift || 'full_day';
        initialData.role = editItem.role || 'warden';
        initialData.notes = editItem.notes || '';
        initialData.buildingId = editItem.assignedBuilding?.documentId || editItem.assignedBuilding?.id || editItem.buildingId || '';
      } else if (type === 'feeplans') {
        initialData.planName = editItem.planName || editItem.name || '';
        initialData.academicYear = editItem.academicYear || 'AY 2026/2027';
        initialData.term = editItem.term || 'Term 1';
        initialData.accommodationFee = editItem.accommodationFee !== undefined ? editItem.accommodationFee : (editItem.termFee || 250.00);
        initialData.securityDeposit = editItem.securityDeposit !== undefined ? editItem.securityDeposit : 50.00;
        initialData.laundryFee = editItem.laundryFee !== undefined ? editItem.laundryFee : 0.00;
        initialData.mealFee = editItem.mealFee !== undefined ? editItem.mealFee : 0.00;
        initialData.transportFee = editItem.transportFee !== undefined ? editItem.transportFee : 0.00;
        initialData.utilityFee = editItem.utilityFee !== undefined ? editItem.utilityFee : 0.00;
        initialData.buildingId = editItem.building?.documentId || editItem.building?.id || '';
        initialData.floorId = editItem.floor?.documentId || editItem.floor?.id || '';
        initialData.roomId = editItem.room?.documentId || editItem.room?.id || '';
        initialData.bedId = editItem.bed?.documentId || editItem.bed?.id || '';
      } else if (type === 'visitors') {
        initialData.visitorName = editItem.visitorName || '';
        initialData.nationalId = editItem.nationalId || '';
        initialData.studentId = editItem.student?.documentId || editItem.student?.id || '';
        initialData.purpose = editItem.purpose || '';
        initialData.checkIn = editItem.checkIn ? new Date(editItem.checkIn).toISOString().slice(0, 16) : '';
        initialData.checkOut = editItem.checkOut ? new Date(editItem.checkOut).toISOString().slice(0, 16) : '';
        initialData.approval = editItem.approval || 'approved';
        initialData.phone = editItem.phone || '';
        initialData.assignedRoom = editItem.assignedRoom || '';
        initialData.dailyCharge = editItem.dailyCharge !== undefined ? editItem.dailyCharge : 50.00;
        initialData.securityDeposit = editItem.securityDeposit !== undefined ? editItem.securityDeposit : 30.00;
        initialData.hostStudent = editItem.hostStudent || '';
        initialData.buildingId = editItem.building?.documentId || editItem.building?.id || '';
        initialData.floorId = editItem.floor?.documentId || editItem.floor?.id || '';
        initialData.roomId = editItem.room?.documentId || editItem.room?.id || '';
        initialData.bedId = editItem.bed?.documentId || editItem.bed?.id || '';
      } else if (type === 'attendance') {
        initialData.studentId = editItem.student?.documentId || editItem.student?.id || editItem.studentId || '';
        initialData.date = editItem.date || '';
        initialData.attendanceStatus = editItem.attendanceStatus || 'present';
        initialData.checkInTime = editItem.checkInTime || '';
        initialData.notes = editItem.notes || '';
      }
      setFormData(initialData);
    } else {
      // Default initial states
      const defaults: any = {};
      if (type === 'buildings') {
        defaults.name = '';
        defaults.genderCategory = 'male';
        defaults.capacity = 100;
      } else if (type === 'floors') {
        defaults.floorName = '';
        defaults.floorNumber = 1;
        defaults.capacity = 50;
        defaults.roomsCount = 0;
        defaults.buildingId = '';
      } else if (type === 'rooms') {
        defaults.roomNumber = '';
        defaults.capacity = 4;
        defaults.status = 'available';
        defaults.roomType = 'quad';
        defaults.buildingId = '';
        defaults.floorId = '';
      } else if (type === 'beds') {
        defaults.bedNumber = '';
        defaults.roomId = '';
        defaults.status = 'available';
      } else if (type === 'gatepasses') {
        defaults.purpose = '';
        defaults.requestDate = new Date().toISOString().split('T')[0];
        defaults.status = 'pending';
      } else if (type === 'maintenance') {
        defaults.issueType = 'water_leakage';
        defaults.description = '';
        defaults.priority = 'medium';
        defaults.status = 'open';
        defaults.cost = 0.00;
      } else if (type === 'visitors') {
        defaults.visitorName = '';
        defaults.nationalId = '';
        defaults.studentId = '';
        defaults.purpose = '';
        defaults.checkIn = new Date().toISOString().slice(0, 16);
        defaults.checkOut = '';
        defaults.approval = 'approved';
        defaults.phone = '';
        defaults.assignedRoom = '';
        defaults.dailyCharge = 50.00;
        defaults.securityDeposit = 30.00;
        defaults.hostStudent = '';
        defaults.buildingId = '';
        defaults.floorId = '';
        defaults.roomId = '';
        defaults.bedId = '';
      } else if (type === 'feeplans') {
        defaults.planName = '';
        defaults.academicYear = 'AY 2026/2027';
        defaults.term = 'Term 1';
        defaults.accommodationFee = 250.00;
        defaults.securityDeposit = 50.00;
        defaults.laundryFee = 0.00;
        defaults.mealFee = 0.00;
        defaults.transportFee = 0.00;
        defaults.utilityFee = 0.00;
        defaults.buildingId = '';
        defaults.floorId = '';
        defaults.roomId = '';
        defaults.bedId = '';
      } else if (type === 'wardens') {
        defaults.name = '';
        defaults.employee = '';
        defaults.phone = '';
        defaults.email = '';
        defaults.buildingId = '';
        defaults.status = 'active';
        defaults.role = 'warden';
        defaults.dutyShift = 'full_day';
        defaults.notes = '';
      } else if (type === 'attendance') {
        defaults.studentId = '';
        defaults.date = new Date().toISOString().split('T')[0];
        defaults.attendanceStatus = 'present';
        defaults.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        defaults.notes = '';
      }
      setFormData(defaults);
    }
  }, [isOpen, type, editItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = getEndpoint();

    try {
      // Map frontend fields back to Strapi DB attributes
      const payload: any = {};
      if (type === 'buildings') {
        payload.name = formData.name;
        payload.code = formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
        payload.gender = formData.genderCategory === 'male' ? 'boys' : formData.genderCategory === 'female' ? 'girls' : 'mixed';
        payload.capacity = Number(formData.capacity);
      } else if (type === 'floors') {
        payload.floorName = formData.floorName;
        payload.floorNumber = Number(formData.floorNumber);
        payload.capacity = Number(formData.capacity || 50);
        payload.roomsCount = Number(formData.roomsCount || 0);
        if (formData.buildingId) {
          payload.building = formData.buildingId;
        }
      } else if (type === 'rooms') {
        payload.roomNumber = formData.roomNumber;
        payload.capacity = Number(formData.capacity);
        payload.status = formData.status || 'available';
        payload.roomType = formData.roomType || 'quad';
        if (formData.buildingId) {
          payload.building = formData.buildingId;
        }
        if (formData.floorId) {
          payload.floor = formData.floorId;
        }
      } else if (type === 'beds') {
        payload.bedNumber = formData.bedNumber;
        payload.status = formData.status || 'available';
        if (formData.roomId) {
          payload.room = formData.roomId;
        }
      } else if (type === 'gatepasses') {
        payload.purpose = formData.purpose;
        payload.requestDate = new Date(formData.requestDate).toISOString();
        payload.status = formData.status;
        payload.parentApproval = formData.status;
        payload.wardenApproval = formData.status;
      } else if (type === 'maintenance') {
        payload.issueType = formData.issueType || 'water_leakage';
        payload.description = formData.description;
        payload.priority = formData.priority;
        payload.status = formData.status;
        payload.cost = Number(formData.cost);
      } else if (type === 'visitors') {
        payload.visitorName = formData.visitorName;
        payload.nationalId = formData.nationalId;
        payload.student = formData.studentId || null;
        payload.purpose = formData.purpose;
        payload.checkIn = formData.checkIn ? new Date(formData.checkIn).toISOString() : null;
        payload.checkOut = formData.checkOut ? new Date(formData.checkOut).toISOString() : null;
        payload.approval = formData.approval || 'approved';
        payload.phone = formData.phone;
        payload.assignedRoom = formData.assignedRoom;
        payload.dailyCharge = Number(formData.dailyCharge || 0);
        payload.securityDeposit = Number(formData.securityDeposit || 0);
        payload.hostStudent = formData.hostStudent;
        payload.building = formData.buildingId || null;
        payload.floor = formData.floorId || null;
        payload.room = formData.roomId || null;
        payload.bed = formData.bedId || null;
      } else if (type === 'feeplans') {
        payload.planName = formData.planName;
        payload.academicYear = formData.academicYear;
        payload.term = formData.term;
        payload.accommodationFee = Number(formData.accommodationFee);
        payload.securityDeposit = Number(formData.securityDeposit);
        payload.laundryFee = Number(formData.laundryFee || 0);
        payload.mealFee = Number(formData.mealFee || 0);
        payload.transportFee = Number(formData.transportFee || 0);
        payload.utilityFee = Number(formData.utilityFee || 0);
        payload.building = formData.buildingId || null;
        payload.floor = formData.floorId || null;
        payload.room = formData.roomId || null;
        payload.bed = formData.bedId || null;
      } else if (type === 'wardens') {
        payload.employee = formData.name || formData.employee || '';
        payload.phone = formData.phone || '';
        payload.email = formData.email || '';
        payload.status = formData.status || 'active';
        payload.dutyShift = formData.dutyShift || 'full_day';
        payload.role = formData.role || 'warden';
        payload.notes = formData.notes || '';
        if (formData.buildingId) {
          payload.assignedBuilding = formData.buildingId;
        }
        payload.assignedFloors = [];
        payload.emergencyContacts = [];
      } else if (type === 'attendance') {
        payload.date = formData.date;
        payload.attendanceStatus = formData.attendanceStatus;
        payload.checkInTime = formData.checkInTime || '';
        payload.notes = formData.notes || '';
        if (formData.studentId) {
          payload.student = formData.studentId;
        }
      }

      const isDummyId = (id: any) => {
        if (!id) return false;
        const s = id.toString();
        return s.startsWith('BLD-') || s.startsWith('RM-') || s.startsWith('FLR-') || s.startsWith('BED-') || s.startsWith('PLAN-') || s.startsWith('WD-') || s.startsWith('VST-') || s.startsWith('GP-') || s.startsWith('TKT-') || s.startsWith('ATT-');
      };

      if (editItem && !isDummyId(editItem.id)) {
        const docId = editItem.documentId || editItem.id;
        await apiClient.put(`${endpoint}/${docId}`, { data: payload });
        toast.success('Record updated successfully.');
      } else {
        await apiClient.post(endpoint, { data: payload });
        toast.success('Record created successfully.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    const action = editItem ? 'Edit' : 'Create New';
    switch (type) {
      case 'buildings': return `${action} Hostel Building`;
      case 'floors': return `${action} Floor Configuration`;
      case 'rooms': return `${action} Room Details`;
      case 'beds': return `${action} Bed Identifier`;
      case 'gatepasses': return `${action} Gate Pass Request`;
      case 'maintenance': return `${action} Maintenance Ticket`;
      case 'visitors': return `${action} Guest / Visitor Record`;
      case 'feeplans': return `${action} Hostel Fee Plan`;
      case 'wardens': return `${action} Warden Profile`;
      case 'attendance': return `${action} Attendance Entry`;
      default: return `${action} Record`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 overflow-hidden">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{getTitle()}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {type === 'buildings' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender Category</label>
                  <select
                    value={formData.genderCategory || 'male'}
                    onChange={(e) => setFormData({ ...formData, genderCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="male">Male (Boys)</option>
                    <option value="female">Female (Girls)</option>
                    <option value="co_ed">Co-Ed (Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'floors' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.floorName || ''}
                  onChange={(e) => setFormData({ ...formData, floorName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    required
                    value={formData.floorNumber || 1}
                    onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity (Beds)</label>
                  <input
                    type="number"
                    value={formData.capacity || 50}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Count</label>
                  <input
                    type="number"
                    value={formData.roomsCount || 0}
                    onChange={(e) => setFormData({ ...formData, roomsCount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parent Boarding Building *</label>
                <select
                  required
                  value={formData.buildingId || ''}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">Select Building...</option>
                  {buildingsList.map((b: any) => (
                    <option key={b.id} value={b.documentId || b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type === 'rooms' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room / Suite Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bed Capacity *</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parent Building *</label>
                  <select
                    required
                    value={formData.buildingId || ''}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Select Building...</option>
                    {buildingsList.map((b: any) => (
                      <option key={b.id} value={b.documentId || b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Configuration *</label>
                  <select
                    required
                    value={formData.floorId || ''}
                    onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Select Floor...</option>
                    {floorsList.map((f: any) => (
                      <option key={f.id} value={f.documentId || f.id}>{f.floorName} ({f.buildingName})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Type *</label>
                  <select
                    value={formData.roomType || 'quad'}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="single">Single Room</option>
                    <option value="double">Double Room</option>
                    <option value="triple">Triple Room</option>
                    <option value="quad">Quad Room</option>
                    <option value="dormitory">Dormitory</option>
                    <option value="vip">VIP Suite</option>
                    <option value="scholarship">Scholarship Room</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Status</label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {type === 'beds' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bed Identifier / Number *</label>
                <input
                  type="text"
                  required
                  value={formData.bedNumber || ''}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assign to Room *</label>
                  <select
                    required
                    value={formData.roomId || ''}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Select Room...</option>
                    {roomsList.map((r: any) => (
                      <option key={r.id} value={r.documentId || r.id}>Suite {r.roomNumber} ({r.buildingName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {type === 'gatepasses' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason / Purpose of Leave *</label>
                <input
                  type="text"
                  required
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Request Date</label>
                  <input
                    type="date"
                    value={formData.requestDate || ''}
                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-950 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Validation Status</label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-955 dark:text-white font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {type === 'maintenance' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                  <select
                    value={formData.issueType || 'water_leakage'}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="broken_bed">Broken Bed</option>
                    <option value="water_leakage">Water Leakage</option>
                    <option value="electrical_fault">Electrical Fault</option>
                    <option value="ac_failure">AC Failure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resolution Status</label>
                  <select
                    value={formData.status || 'open'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Repair Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || 0}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'visitors' && (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.visitorName || ''}
                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Passport / National ID</label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Student / Scholar (Relation)</label>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Student...</option>
                    {studentsList.map((s: any) => (
                      <option key={s.id} value={s.documentId || s.id}>{s.name || `${s.firstName} ${s.lastName}`} ({s.studentId || s.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Host Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.hostStudent || ''}
                    onChange={(e) => setFormData({ ...formData, hostStudent: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                    placeholder="e.g. Br. Ahmed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    value={formData.purpose || ''}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Check-in Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.checkIn || ''}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-950 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Check-out</label>
                  <input
                    type="datetime-local"
                    value={formData.checkOut || ''}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-955 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Charge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyCharge !== undefined ? formData.dailyCharge : 50.00}
                    onChange={(e) => setFormData({ ...formData, dailyCharge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deposit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.securityDeposit !== undefined ? formData.securityDeposit : 30.00}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.approval || 'approved'}
                    onChange={(e) => setFormData({ ...formData, approval: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 text-xs">
                <span className="block font-bold text-slate-500 mb-2 text-[10px] uppercase tracking-wider">Assigned Suite / Accommodation Scope</span>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Room Name (Text)</label>
                    <input
                      type="text"
                      value={formData.assignedRoom || ''}
                      onChange={(e) => setFormData({ ...formData, assignedRoom: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                      placeholder="e.g. Room 101"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building</label>
                    <select
                      value={formData.buildingId || ''}
                      onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Building...</option>
                      {buildingsList.map((b: any) => (
                        <option key={b.id} value={b.documentId || b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor</label>
                    <select
                      value={formData.floorId || ''}
                      onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Floor...</option>
                      {floorsList.map((f: any) => (
                        <option key={f.id} value={f.documentId || f.id}>{f.floorName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room</label>
                    <select
                      value={formData.roomId || ''}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Room...</option>
                      {roomsList.map((r: any) => (
                        <option key={r.id} value={r.documentId || r.id}>Suite {r.roomNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bed</label>
                    <select
                      value={formData.bedId || ''}
                      onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Bed...</option>
                      {bedsList.map((b: any) => (
                        <option key={b.id} value={b.documentId || b.id}>Bed {b.bedNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'feeplans' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.planName || ''}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear || ''}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Term *</label>
                  <input
                    type="text"
                    required
                    value={formData.term || ''}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-semibold"
                    placeholder="e.g. Term 1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Accommodation Fee ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.accommodationFee || ''}
                    onChange={(e) => setFormData({ ...formData, accommodationFee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Security Deposit ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.securityDeposit || ''}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Laundry Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.laundryFee || 0}
                    onChange={(e) => setFormData({ ...formData, laundryFee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Meal Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mealFee || 0}
                    onChange={(e) => setFormData({ ...formData, mealFee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transport Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.transportFee || 0}
                    onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Utility Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.utilityFee || 0}
                    onChange={(e) => setFormData({ ...formData, utilityFee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 text-xs">
                <span className="block font-bold text-slate-500 mb-2 text-[10px] uppercase tracking-wider">Applicable Scope (Optional)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Scope</label>
                    <select
                      value={formData.buildingId || ''}
                      onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Buildings</option>
                      {buildingsList.map((b: any) => (
                        <option key={b.id} value={b.documentId || b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Scope</label>
                    <select
                      value={formData.floorId || ''}
                      onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Floors</option>
                      {floorsList.map((f: any) => (
                        <option key={f.id} value={f.documentId || f.id}>{f.floorName} ({f.buildingName})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Scope</label>
                    <select
                      value={formData.roomId || ''}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Rooms</option>
                      {roomsList.map((r: any) => (
                        <option key={r.id} value={r.documentId || r.id}>Suite {r.roomNumber} ({r.buildingName || r.building?.name || 'Main Hall'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bed Scope</label>
                    <select
                      value={formData.bedId || ''}
                      onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Beds</option>
                      {bedsList.map((b: any) => (
                        <option key={b.id} value={b.documentId || b.id}>Bed {b.bedNumber} (Room {b.roomNumber || b.room?.roomNumber || '101'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'wardens' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Warden Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || formData.employee || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, employee: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Ustadh Omar Bilal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role / Title *</label>
                  <select
                    required
                    value={formData.role || 'warden'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="chief_warden">Chief Warden</option>
                    <option value="warden">Warden</option>
                    <option value="assistant_warden">Assistant Warden</option>
                    <option value="resident_assistant">Resident Assistant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duty Shift</label>
                  <select
                    value={formData.dutyShift || 'full_day'}
                    onChange={(e) => setFormData({ ...formData, dutyShift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                    <option value="full_day">Full Day</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    placeholder="+231 886 000 000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    placeholder="warden@school.edu"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Building *</label>
                  <select
                    required
                    value={formData.buildingId || ''}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Select Building...</option>
                    {buildingsList.map((b: any) => (
                      <option key={b.id} value={b.documentId || b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Active Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="active">Active (On Duty)</option>
                    <option value="inactive">Inactive (Off Duty)</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="Any notes about this warden's responsibilities..."
                />
              </div>
            </>
          )}


          {type === 'attendance' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scholar / Boarder *</label>
                <select
                  required
                  value={formData.studentId || ''}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Active Boarder...</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.documentId || s.id}>
                      {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()} ({s.studentId || s.admissionNumber || s.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attendance Status *</label>
                  <select
                    required
                    value={formData.attendanceStatus || 'present'}
                    onChange={(e) => setFormData({ ...formData, attendanceStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white font-semibold"
                  >
                    <option value="present">✅ Present</option>
                    <option value="absent">❌ Absent</option>
                    <option value="late">⚠️ Late</option>
                    <option value="excused">📋 Excused</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={formData.checkInTime || ''}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Late due to medical visit..."
                />
              </div>
            </>
          )}


          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
