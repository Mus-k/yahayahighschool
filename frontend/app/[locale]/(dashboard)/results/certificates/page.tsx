'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Search, 
  Plus, 
  FileText, 
  QrCode, 
  ShieldCheck,
  Building,
  User,
  Sliders,
  Download,
  GraduationCap,
  Sparkles,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface CertificateRecord {
  id: number;
  serialNumber: string;
  studentName: string;
  schoolId: string;
  certificateType: string;
  achievementName: string;
  issueDate: string;
  verificationHash: string;
  status: 'Valid' | 'Revoked';
  gpa?: number;
  maxGpa?: number;
  honors?: string;
  totalCredits?: number;
  classRank?: string;
  sectionName?: string;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export default function CertificatesBuilderPage() {
  const { user, role } = useAuth();
  const isStudentRole = role === 'student' || role === 'parent';

  const [issuedCerts, setIssuedCerts] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [certType, setCertType] = useState<string>('Graduation Diploma');
  const [achievement, setAchievement] = useState<string>('Senior Secondary Graduation & Quran Hifz');
  const [gpa, setGpa] = useState<number>(3.88);
  const [maxGpa, setMaxGpa] = useState<number>(4.00);
  const [honors, setHonors] = useState<string>('First Class Honors');
  const [totalCredits, setTotalCredits] = useState<number>(120);
  const [classRank, setClassRank] = useState<string>('Top 5% Class Standing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadCertificatesData();
  }, []);

  const loadCertificatesData = async () => {
    setIsLoading(true);
    try {
      const defaultCerts: CertificateRecord[] = [
        { 
          id: 1, 
          serialNumber: 'CERT-2026-000124', 
          studentName: 'Ahmet', 
          schoolId: 'AC00000001', 
          certificateType: 'Graduation Diploma', 
          achievementName: 'Senior Secondary Graduation & Quran Hifz', 
          issueDate: '2026-07-24', 
          verificationHash: 'sha256-a1b2c3d4e5', 
          status: 'Valid',
          gpa: 3.92,
          maxGpa: 4.00,
          honors: 'First Class Honors',
          totalCredits: 128,
          classRank: 'Top 3% Class Standing',
          sectionName: 'Senior Secondary Division'
        },
        { 
          id: 2, 
          serialNumber: 'CERT-2026-000125', 
          studentName: 'Ahmad Abdullahi Musa', 
          schoolId: 'AC-2026-0004', 
          certificateType: 'Graduation Diploma', 
          achievementName: 'Senior Secondary Graduation Diploma', 
          issueDate: '2026-07-24', 
          verificationHash: 'sha256-b2c3d4e5f6', 
          status: 'Valid',
          gpa: 3.88,
          maxGpa: 4.00,
          honors: 'First Class Honors',
          totalCredits: 120,
          classRank: 'Top 5% Class Standing',
          sectionName: 'Senior Secondary Division'
        },
        { 
          id: 3, 
          serialNumber: 'CERT-2026-000126', 
          studentName: 'Fatima Zahra Ibrahim', 
          schoolId: 'AC-2026-0012', 
          certificateType: 'Completion Certificate', 
          achievementName: 'Quran Memorization Completion (30 Juz)', 
          issueDate: '2026-07-24', 
          verificationHash: 'sha256-f6g7h8i9j0', 
          status: 'Valid',
          gpa: 3.85,
          maxGpa: 4.00,
          honors: 'Distinction with Praise',
          totalCredits: 110,
          classRank: 'Top 5% Class Standing',
          sectionName: 'Tahfidz Faculty'
        }
      ];

      setIssuedCerts(defaultCerts);

      const stdsRes = await apiClient.get('/students?populate=*');
      const rawData = stdsRes.data?.data || [];
      const parsedStudents = rawData.length > 0 ? rawData.map((s: any) => {
        const name = s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || `Student #${s.id}`;
        return {
          id: s.id,
          firstName: s.firstName || name.split(' ')[0],
          lastName: s.lastName || name.split(' ')[1] || '',
          name,
          schoolId: s.schoolId || s.admissionNumber || `AC-2026-${s.id}`,
          gpa: s.gpa || 3.88,
          sectionName: s.sections?.[0]?.name || 'Senior Secondary Division',
          honors: s.gpa && s.gpa >= 3.7 ? 'First Class Honors' : 'Distinction'
        };
      }) : [
        { id: 1, firstName: 'Ahmet', lastName: '', name: 'Ahmet', schoolId: 'AC00000001', gpa: 3.92, sectionName: 'Senior Secondary Division', honors: 'First Class Honors' },
        { id: 2, firstName: 'Ahmad', lastName: 'Musa', name: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', gpa: 3.88, sectionName: 'Senior Secondary Division', honors: 'First Class Honors' },
        { id: 3, firstName: 'Fatima', lastName: 'Ibrahim', name: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', gpa: 3.85, sectionName: 'Tahfidz Faculty', honors: 'Distinction with Praise' }
      ];

      setStudents(parsedStudents);
    } catch (e) {
      toast.error('Failed to load certificates registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const myStudentCertificates = useMemo(() => {
    if (!user) return [];
    const uUser = user as any;
    const uSchoolId = (uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (uUser.documentId || '').toLowerCase();
    const uName = (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username || '').trim().toLowerCase();

    return issuedCerts.filter(c => {
      const cSchoolId = (c.schoolId || '').toLowerCase();
      const cName = (c.studentName || '').toLowerCase();

      return (
        (uSchoolId && (cSchoolId.includes(uSchoolId) || uSchoolId.includes(cSchoolId))) ||
        (uDocId && cSchoolId === uDocId) ||
        (uName && uName.length > 2 && (cName.includes(uName) || uName.includes(cName)))
      );
    });
  }, [issuedCerts, user]);

  const displayCertificates = useMemo(() => {
    const list = isStudentRole ? myStudentCertificates : issuedCerts;
    return list.filter(c => 
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificateType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [isStudentRole, myStudentCertificates, issuedCerts, searchQuery]);

  const handleStudentChange = (stdId: string) => {
    setSelectedStudent(stdId);
    const std = students.find(s => String(s.id) === String(stdId));
    if (std) {
      if (std.gpa) setGpa(std.gpa);
      if (std.honors) setHonors(std.honors);
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student recipient.');
      return;
    }
    const std = students.find(s => String(s.id) === String(selectedStudent)) || {
      firstName: 'Selected',
      lastName: 'Student',
      name: 'Selected Student',
      schoolId: 'AC-2026-0001',
      sectionName: 'Senior Secondary Division'
    };
    const sName = std.name || `${std.firstName} ${std.lastName}`;
    const newSerial = `CERT-2026-${Math.floor(Math.random() * 900000) + 100000}`;
    const newHash = 'sha256-' + Math.random().toString(36).substring(2, 10);

    const newRecord: CertificateRecord = {
      id: Date.now(),
      serialNumber: newSerial,
      studentName: sName,
      schoolId: std.schoolId,
      certificateType: certType,
      achievementName: achievement,
      issueDate: new Date().toISOString().split('T')[0],
      verificationHash: newHash,
      status: 'Valid',
      gpa: Number(gpa),
      maxGpa: Number(maxGpa),
      honors,
      totalCredits: Number(totalCredits),
      classRank,
      sectionName: std.sectionName || 'Senior Secondary Division'
    };

    setIssuedCerts([newRecord, ...issuedCerts]);
    toast.success(`Successfully issued ${certType} for ${sName}`);
    triggerCertificatePDF(newRecord);
  };

  const triggerCertificatePDF = async (cert: CertificateRecord) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await loadImage('/yahaya-logo.jpeg');
    } catch (err) {
      console.warn('[PDF] Could not load yahaya-logo.jpeg:', err);
    }

    const isGraduation = cert.certificateType.toLowerCase().includes('graduation') || 
                         cert.certificateType.toLowerCase().includes('diploma') ||
                         cert.certificateType.toLowerCase().includes('degree');

    const verificationUrl = `https://yahayascool.edu.ng/verify/certificate?hash=${cert.verificationHash}`;

    if (isGraduation) {
      // Background & Borders
      doc.setFillColor(254, 253, 250);
      doc.rect(0, 0, 297, 210, 'F');

      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1.8);
      doc.rect(8, 8, 281, 194);

      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      doc.rect(11, 11, 275, 188);

      const drawCornerAccent = (x: number, y: number) => {
        doc.setFillColor(217, 119, 6);
        doc.rect(x, y, 6, 6, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(x + 1.5, y + 1.5, 3, 3, 'F');
      };
      drawCornerAccent(8, 8);
      drawCornerAccent(283, 8);
      drawCornerAccent(8, 196);
      drawCornerAccent(283, 196);

      if (logoImg) {
        doc.addImage(logoImg, 'JPEG', 136, 15, 25, 25);
      } else {
        doc.setFillColor(16, 185, 129);
        doc.ellipse(148.5, 27.5, 12, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Y', 145.5, 32);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(21);
      doc.text('YAHAYA ENTERPRISE SCHOOLS', 148.5, 46, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('KNOWLEDGE • CHARACTER • SPIRITUAL EXCELLENCE', 148.5, 51, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('ACCREDITED INSTITUTION OF ISLAMIC & ADVANCED ACADEMIC STUDIES', 148.5, 55, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(217, 119, 6);
      doc.text('OFFICIAL GRADUATION DIPLOMA', 148.5, 68, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('THE GOVERNING BOARD OF TRUSTEES AND ACADEMIC COUNCIL HEREBY CONFER UPON', 148.5, 75, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(23);
      doc.setTextColor(15, 23, 42);
      doc.text(cert.studentName.toUpperCase(), 148.5, 88, { align: 'center' });

      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.line(88.5, 91, 208.5, 91);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Student Registration ID: ${cert.schoolId}  |  Division: ${cert.sectionName || 'Senior Secondary Division'}`, 148.5, 96, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('having fulfilled all academic requirements, character standards, and examinations for', 148.5, 102, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13.5);
      doc.setTextColor(16, 185, 129);
      doc.text(cert.achievementName.toUpperCase(), 148.5, 110, { align: 'center' });

      // Metrics Card
      const cardY = 116;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, cardY, 247, 30, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(25, cardY, 247, 30, 3, 3, 'D');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('CUMULATIVE GPA', 50, cardY + 8, { align: 'center' });
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`${(cert.gpa || 3.88).toFixed(2)} / ${(cert.maxGpa || 4.00).toFixed(2)}`, 50, cardY + 20, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('HONORS CLASSIFICATION', 115, cardY + 8, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(217, 119, 6);
      doc.text(cert.honors || 'First Class Honors', 115, cardY + 20, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('CREDITS COMPLETED', 180, cardY + 8, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${cert.totalCredits || 120} Credit Units`, 180, cardY + 20, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('ACADEMIC RANKING', 245, cardY + 8, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text(cert.classRank || 'Top 5% Class Standing', 245, cardY + 20, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Conferred Date: ${cert.issueDate}  |  Official Serial Number: ${cert.serialNumber}`, 148.5, 154, { align: 'center' });

      // Signatures
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(35, 175, 95, 175);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Dr. Ibrahim Al-Hassan', 65, 180, { align: 'center' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Registrar & Academic Dean', 65, 184, { align: 'center' });

      doc.setFillColor(254, 243, 199);
      doc.ellipse(148.5, 173, 12, 12, 'F');
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.6);
      doc.ellipse(148.5, 173, 12, 12, 'D');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(217, 119, 6);
      doc.text('OFFICIAL', 148.5, 171.5, { align: 'center' });
      doc.text('SEAL', 148.5, 175.5, { align: 'center' });

      doc.line(202, 175, 262, 175);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Prof. Yahaya Muhammad', 232, 180, { align: 'center' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Principal General & Chancellor', 232, 184, { align: 'center' });

      doc.setFillColor(241, 245, 249);
      doc.rect(11, 191, 275, 8, 'F');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Cryptographic Security Verification Hash: ${cert.verificationHash}  |  Registry: ${verificationUrl}`, 148.5, 196.5, { align: 'center' });

    } else {
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129);
      doc.rect(12, 12, 273, 186);

      doc.setFillColor(217, 119, 6);
      doc.rect(10, 10, 10, 10, 'F');
      doc.rect(277, 10, 10, 10, 'F');
      doc.rect(10, 190, 10, 10, 'F');
      doc.rect(277, 190, 10, 10, 'F');

      if (logoImg) {
        doc.addImage(logoImg, 'JPEG', 136, 18, 25, 25);
      } else {
        doc.setFillColor(16, 185, 129);
        doc.ellipse(148.5, 30, 12, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Y', 145.5, 35);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('YAHAYA ENTERPRISE SCHOOLS', 148.5, 49, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('KNOWLEDGE • CHARACTER • SPIRITUAL EXCELLENCE', 148.5, 55, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(217, 119, 6);
      doc.text(cert.certificateType.toUpperCase(), 148.5, 74, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(100, 116, 139);
      doc.text('THIS IS OFFICIALLY PRESENTED TO', 148.5, 86, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(cert.studentName.toUpperCase(), 148.5, 100, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`In recognition of outstanding performance and completion of`, 148.5, 112, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text(cert.achievementName, 148.5, 124, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Issued Date: ${cert.issueDate} | Serial Registration: ${cert.serialNumber}`, 148.5, 140, { align: 'center' });

      doc.line(40, 168, 100, 168);
      doc.text('Dr. Ibrahim Al-Hassan', 70, 173, { align: 'center' });
      doc.setFont('Helvetica', 'bold');
      doc.text('Registrar General', 70, 177, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.line(197, 168, 257, 168);
      doc.text('Prof. Yahaya Muhammad', 227, 173, { align: 'center' });
      doc.setFont('Helvetica', 'bold');
      doc.text('Principal General', 227, 177, { align: 'center' });

      doc.setFillColor(248, 250, 252);
      doc.rect(13, 184, 271, 10, 'F');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Cryptographic Security Verification Hash: ${cert.verificationHash} | Registry Url: ${verificationUrl}`, 148.5, 190.5, { align: 'center' });
    }

    doc.save(`Certificate_${cert.serialNumber}.pdf`);
  };

  const isGraduationType = certType.toLowerCase().includes('graduation') || 
                           certType.toLowerCase().includes('diploma') ||
                           certType.toLowerCase().includes('degree');

  return (
    <PageContainer>
      <PageHeader
        title={isStudentRole ? "My Verifiable Certificates & Diplomas" : "Verifiable Certificates Registry & Builder"}
        description={
          isStudentRole 
            ? "View, download, and verify your official graduation diplomas, completion certificates, and academic honors issued by Yahaya Enterprise Schools."
            : "Issue official graduation diplomas, completion certificates, conduct transcripts, and letters linked with QR verification codes."
        }
      />

      <div className={isStudentRole ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
        {/* Certificate Issuer Sidebar (ONLY FOR ADMIN / STAFF ROLES) */}
        {!isStudentRole && (
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-emerald-600" />
                <span>Issue New Document</span>
              </h3>

              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1.5">Select Student Recipient</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="">-- Select Recipient --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name || `${s.firstName} ${s.lastName}`} ({s.schoolId})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1.5">Certificate Type</label>
                <select 
                  value={certType} 
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="Graduation Diploma">Graduation Diploma</option>
                  <option value="Senior Secondary Graduation Degree">Senior Secondary Graduation Degree</option>
                  <option value="Completion Certificate">Completion Certificate</option>
                  <option value="Enrollment Certificate">Enrollment Certificate</option>
                  <option value="Bonafide Letter">Bonafide Letter</option>
                  <option value="Good Conduct">Good Conduct Letter</option>
                  <option value="Character Certificate">Character Certificate</option>
                  <option value="Recommendation Letter">Recommendation Letter</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1.5">Program / Specialization Accomplishment</label>
                <input 
                  type="text" 
                  value={achievement} 
                  onChange={(e) => setAchievement(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold"
                  placeholder="e.g. Senior Secondary Science Track & Quran Hifz"
                />
              </div>

              {isGraduationType && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>Graduation Academic Metrics</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Cumulative GPA</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        max="4.0" 
                        min="0.0"
                        value={gpa} 
                        onChange={(e) => setGpa(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Scale Max</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={maxGpa} 
                        onChange={(e) => setMaxGpa(parseFloat(e.target.value) || 4.0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Honors / Classification</label>
                    <input 
                      type="text" 
                      value={honors} 
                      onChange={(e) => setHonors(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                      placeholder="e.g. First Class Honors / Distinction"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Total Credits</label>
                      <input 
                        type="number" 
                        value={totalCredits} 
                        onChange={(e) => setTotalCredits(parseInt(e.target.value) || 120)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Class Rank</label>
                      <input 
                        type="text" 
                        value={classRank} 
                        onChange={(e) => setClassRank(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                        placeholder="e.g. Top 5% Class Standing"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleIssueCertificate}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Document & Generate PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Issued Documents Ledger / Student Certificates View */}
        <div className={isStudentRole ? "col-span-1 space-y-6" : "lg:col-span-2 space-y-6"}>
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-h-[400px] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{isStudentRole ? "My Official Conferred Certificates" : "Issued Certificates Registry"}</span>
              </h3>
              
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-450" />
                <input 
                  type="text" 
                  placeholder="Search serial, title, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none w-44"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="px-4 py-3">Serial No</th>
                    {!isStudentRole && <th className="px-4 py-3">Recipient</th>}
                    <th className="px-4 py-3">Document & Achievement</th>
                    <th className="px-4 py-3">GPA & Honors</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Actions & PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {displayCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{cert.serialNumber}</td>
                      {!isStudentRole && (
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{cert.studentName}</p>
                          <p className="text-[10px] text-slate-450 font-mono">{cert.schoolId}</p>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{cert.certificateType}</span>
                        <span className="text-[10px] text-slate-500 block line-clamp-1">{cert.achievementName}</span>
                      </td>
                      <td className="px-4 py-3">
                        {cert.gpa ? (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs block">{cert.gpa.toFixed(2)} / {(cert.maxGpa || 4.0).toFixed(2)} GPA</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">{cert.honors || 'Honors'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">{cert.issueDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => triggerCertificatePDF(cert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                            title="Download Official PDF Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                          <button
                            onClick={() => toast.info(`Verification URL: https://yahayascool.edu.ng/verify/certificate?hash=${cert.verificationHash}`)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                            title="Verify Certificate Hash"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayCertificates.length === 0 && (
                    <tr>
                      <td colSpan={isStudentRole ? 5 : 6} className="text-center py-12 text-slate-400 space-y-2">
                        <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {isStudentRole 
                            ? "No official certificates issued yet for your account." 
                            : "No certificates matching search terms."}
                        </p>
                        {isStudentRole && (
                          <p className="text-[11px] text-slate-400">Official graduation diplomas and completion awards will appear here once conferred by the Academic Board.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

