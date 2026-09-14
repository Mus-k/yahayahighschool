'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, CheckCircle2, ShieldCheck, UserCheck, Calendar, FileText, Send, Sparkles } from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { AdmissionApplicationPayload } from '@/types/cms.types';

export default function OnlineRegistrationPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<AdmissionApplicationPayload>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '2012-01-01',
    gender: 'male',
    nationality: 'Nigerian',
    religion: 'Islam',
    address: '',
    previousSchool: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    desiredProgram: 'Tahfidz Al-Qur\'an & Tajweed Mastery',
    desiredDepartment: 'Faculty of Islamic Sciences & Qur\'an',
    desiredSection: 'Junior High School (JSS 1)',
    hostelRequired: true,
    medicalInfo: 'None',
  });

  const handleChange = (field: keyof AdmissionApplicationPayload, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        setErrorMsg('Please complete all required student details before continuing.');
        return;
      }
    } else if (step === 2) {
      if (!formData.parentName || !formData.parentPhone || !formData.parentEmail) {
        setErrorMsg('Please enter all required parent/guardian contact information.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await cmsService.submitAdmissionApplication(formData);
    setLoading(false);

    if (res.success) {
      setApplicationNumber(res.applicationNumber || `YSC-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(4); // Success screen
    } else {
      setErrorMsg(res.message || 'Failed to submit application. Please verify all details or try again later.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Official Online Admission Portal (2026/2027)</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            Online Admission Application
          </h1>
          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            Secure your child\'s placement in our high-achieving Cambridge, STEM, and Tahfidz Al-Qur\'an tracks. All applications are reviewed by our Admissions Council.
          </p>
        </div>
      </section>

      {/* Progress Steps Indicator */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 flex items-center justify-between">
          {[
            { id: 1, label: '1. Student Details' },
            { id: 2, label: '2. Parent / Guardian' },
            { id: 3, label: '3. Academic Track' },
            { id: 4, label: '4. Confirmation' },
          ].map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.id
                    ? 'bg-emerald-900 text-white shadow-md'
                    : step > s.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </div>
              <span className={`hidden sm:inline text-xs font-bold ${step === s.id ? 'text-emerald-950' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-10">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-gray-200/80 shadow-md">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-8 text-xs sm:text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-950 pb-4 border-b border-gray-100 flex items-center justify-between">
                <span>Step 1: Student Personal Information</span>
                <span className="text-xs font-normal text-gray-500">* Required fields</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="e.g. Yusuf"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleChange('middleName', e.target.value)}
                    placeholder="e.g. Al-Hassan"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Last / Family Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="e.g. Ibrahim"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value as 'male' | 'female')}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Residential Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address, city, state/province"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Previous School Attended
                  </label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) => handleChange('previousSchool', e.target.value)}
                    placeholder="Name of last school completed"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Medical Information / Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.medicalInfo}
                    onChange={(e) => handleChange('medicalInfo', e.target.value)}
                    placeholder="State 'None' if healthy or list any conditions"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl font-bold text-white bg-emerald-900 hover:bg-emerald-800 shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continue to Parent Info</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-950 pb-4 border-b border-gray-100 flex items-center justify-between">
                <span>Step 2: Parent / Guardian Contact Details</span>
                <span className="text-xs font-normal text-gray-500">* Required fields</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Parent / Guardian Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => handleChange('parentName', e.target.value)}
                    placeholder="e.g. Alhaji Ibrahim Sulaiman"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Occupation / Profession
                  </label>
                  <input
                    type="text"
                    value={formData.parentOccupation}
                    onChange={(e) => handleChange('parentOccupation', e.target.value)}
                    placeholder="e.g. University Professor / Engineer"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Parent Telephone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => handleChange('parentPhone', e.target.value)}
                    placeholder="+234 (0) 803 123 4567"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Parent Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.parentEmail}
                    onChange={(e) => handleChange('parentEmail', e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl font-bold text-white bg-emerald-900 hover:bg-emerald-800 shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continue to Track Selection</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-emerald-950 pb-4 border-b border-gray-100">
                Step 3: Desired Academic Track & Grade Level
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Grade Section / Level *
                  </label>
                  <select
                    value={formData.desiredSection}
                    onChange={(e) => handleChange('desiredSection', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  >
                    <option value="Junior High School (JSS 1)">Junior High School (JSS 1)</option>
                    <option value="Junior High School (JSS 2)">Junior High School (JSS 2)</option>
                    <option value="Senior High School (SSS 1 / Year 10)">Senior High School (SSS 1 / Year 10)</option>
                    <option value="Senior High School (SSS 2 / Year 11)">Senior High School (SSS 2 / Year 11)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Academic Faculty / Department *
                  </label>
                  <select
                    value={formData.desiredDepartment}
                    onChange={(e) => handleChange('desiredDepartment', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                  >
                    <option value="Faculty of Islamic Sciences & Qur'an">Faculty of Islamic Sciences & Qur\'an</option>
                    <option value="Faculty of Pure & Applied Sciences">Faculty of Pure & Applied Sciences (STEM)</option>
                    <option value="Department of Languages & Linguistics">Department of Languages & Linguistics</option>
                    <option value="Faculty of Humanities & Commerce">Faculty of Humanities & Commerce</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Specialized Program Track *
                </label>
                <select
                  value={formData.desiredProgram}
                  onChange={(e) => handleChange('desiredProgram', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-emerald-600 transition-colors"
                >
                  <option value="Tahfidz Al-Qur'an & Tajweed Mastery">Tahfidz Al-Qur\'an & Tajweed Mastery (3-Year Track)</option>
                  <option value="STEM & Robotics Honors Track">STEM & Robotics Honors Track (Cambridge IGCSE + SAT)</option>
                  <option value="Advanced Arabic Immersion Track">Advanced Arabic Immersion Track</option>
                  <option value="General High School Dual Curriculum">General High School Dual Curriculum</option>
                </select>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-950 text-base">Hostel Boarding Accommodation</h4>
                  <p className="text-gray-600 text-base mt-1">
                    Supervised 24/7 boarding facilities with nutritious halal meals and evening Qur\'anic revision circles.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={formData.hostelRequired}
                    onChange={(e) => handleChange('hostelRequired', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-900"></div>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  By clicking submit below, I confirm that all submitted details for <strong>{formData.firstName} {formData.lastName}</strong> are accurate and I agree to abide by the Islamic moral and academic discipline policies of YAHAYASCOOL.
                </span>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 rounded-xl font-bold text-white bg-emerald-900 hover:bg-emerald-800 shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Submitting Application...' : 'Submit Online Application'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-6 animate-in fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-900 mx-auto flex items-center justify-center font-bold shadow-md">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>

              <h2 className="text-3xl font-extrabold text-emerald-950">
                Alhamdulillah! Application Submitted Successfully
              </h2>

              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 max-w-md mx-auto">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">
                  OFFICIAL APPLICATION NUMBER
                </span>
                <span className="text-3xl font-extrabold text-emerald-900 font-mono tracking-wider">
                  {applicationNumber}
                </span>
              </div>

              <p className="text-gray-600 text-base max-w-xl mx-auto leading-relaxed">
                An automated confirmation and assessment date invitation will be sent to <strong>{formData.parentEmail}</strong> and <strong>{formData.parentPhone}</strong> within 48 hours.
              </p>

              <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-colors"
                >
                  Return to Homepage
                </Link>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Print / Save Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
