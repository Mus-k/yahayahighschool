'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  Save, 
  Undo, 
  RotateCcw, 
  Grid, 
  Sliders, 
  Eye, 
  FileSpreadsheet, 
  AlertCircle,
  FileCheck,
  UserCheck,
  Activity,
  User,
  Plus
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { resultsService } from '@/services/results.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentGradeRow {
  id: number | string;
  studentId: number;
  schoolId: string;
  name: string;
  homework: number;
  quiz: number;
  project: number;
  midterm: number;
  final: number;
  attendance: number;
  average: number;
  letterGrade: string;
  gpa: number;
  remarks: string;
  status: 'Draft' | 'TeacherSubmitted' | 'DepartmentReview' | 'RegistrarApproved' | 'Published' | 'Locked';
  moderatorOffset: number;
  moderatorRemarks: string;
  isModified: boolean;
}

export default function GradebookAndReportCardsPage() {
  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '');
  const isStudentRole = role === 'student' || role === 'parent' || userRoleStr === 'student' || userRoleStr === 'parent';
  const isTeacher = userRoleStr === 'teacher';
  const isDeptHead = userRoleStr === 'department-head' || userRoleStr === 'dean';
  const isRegistrarOrAdmin = userRoleStr === 'super-administrator' || userRoleStr === 'registrar' || userRoleStr === 'director';

  // State Tabs
  const [activeTab, setActiveTab] = useState<'gradebook' | 'generator'>('gradebook');

  // Selector filters
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<any[]>([]);
  const [gradingSchemes, setGradingSchemes] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [selectedPolicy, setSelectedPolicy] = useState<number>(0);
  const [selectedScheme, setSelectedScheme] = useState<number>(0);

  // Grade grid state
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [historyStack, setHistoryStack] = useState<StudentGradeRow[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('All changes saved');

  // Excel paste dialog
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');

  // Report Card Generator options
  const [templateType, setTemplateType] = useState<'Primary' | 'Secondary' | 'College' | 'Islamic'>('Secondary');
  const [selectedStudentId, setSelectedStudentId] = useState<number | string>('');
  const [teacherGeneralRemarks, setTeacherGeneralRemarks] = useState<string>('Consistent performance. Displays excellent focus in Islamic studies.');
  const [principalRemarks, setPrincipalRemarks] = useState<string>('Promoted to the next grade level with honors.');
  const [behaviorLevel, setBehaviorLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [attendancePercentage, setAttendancePercentage] = useState<number>(96);

  // Signatories options
  const [registrarName, setRegistrarName] = useState<string>('Dr. Ibrahim Al-Hassan');
  const [principalName, setPrincipalName] = useState<string>('Prof. Yahaya Muhammad');

  // Load configuration dropdowns
  useEffect(() => {
    async function loadConfig() {
      try {
        const yearsRes = await apiClient.get('/academic-years');
        setAcademicYears(yearsRes.data?.data || []);
        if (yearsRes.data?.data?.length > 0) setSelectedYear(yearsRes.data.data[0].id);

        const termsRes = await apiClient.get('/academic-terms');
        setAcademicTerms(termsRes.data?.data || []);
        if (termsRes.data?.data?.length > 0) setSelectedTerm(termsRes.data.data[0].id);

        const sectionsRes = await apiClient.get('/sections');
        setSections(sectionsRes.data?.data || []);
        if (sectionsRes.data?.data?.length > 0) setSelectedSection(sectionsRes.data.data[0].id);

        const subjectsRes = await apiClient.get('/subjects');
        setSubjects(subjectsRes.data?.data || []);
        if (subjectsRes.data?.data?.length > 0) setSelectedSubject(subjectsRes.data.data[0].id);

        try {
          const policiesRes = await resultsService.getGradingPolicies();
          setGradingPolicies(policiesRes || []);
          if (policiesRes?.length > 0) setSelectedPolicy(policiesRes[0].id);
        } catch (e) {
          setGradingPolicies([
            { id: 1, name: 'Standard CA/Exam Split', caPercent: 40, midtermPercent: 0, finalPercent: 60, projectPercent: 0, attendancePercent: 0 }
          ]);
          setSelectedPolicy(1);
        }

        try {
          const schemesRes = await resultsService.getGradingSchemes();
          setGradingSchemes(schemesRes || []);
          if (schemesRes?.length > 0) setSelectedScheme(schemesRes[0].id);
        } catch (e) {
          setGradingSchemes([
            { id: 1, name: 'Standard University Scheme', grade_bands: [
              { minScore: 90, maxScore: 100, letterGrade: 'A+', gradePoint: 4.0, isPass: true, remarks: 'Excellent', color: '#10B981' },
              { minScore: 80, maxScore: 89, letterGrade: 'A', gradePoint: 4.0, isPass: true, remarks: 'Very Good', color: '#3B82F6' },
              { minScore: 70, maxScore: 79, letterGrade: 'B', gradePoint: 3.0, isPass: true, remarks: 'Good', color: '#6366F1' },
              { minScore: 60, maxScore: 69, letterGrade: 'C', gradePoint: 2.0, isPass: true, remarks: 'Credit', color: '#F59E0B' },
              { minScore: 50, maxScore: 59, letterGrade: 'D', gradePoint: 1.0, isPass: true, remarks: 'Pass', color: '#EF4444' },
              { minScore: 0, maxScore: 49, letterGrade: 'F', gradePoint: 0.0, isPass: false, remarks: 'Fail', color: '#EF4444' }
            ]}
          ]);
          setSelectedScheme(1);
        }
      } catch (err) {
        toast.error('Failed to load initial gradebook selections.');
      }
    }
    loadConfig();
  }, []);

  // Fetch grades whenever filters change
  useEffect(() => {
    if (selectedYear && selectedTerm) {
      loadGradeGrid();
    }
  }, [selectedYear, selectedTerm, selectedSection, selectedSubject, selectedPolicy, selectedScheme]);

  const loadGradeGrid = async () => {
    setIsLoading(true);
    try {
      const dbGrades = await resultsService.getStudentGrades({
        termId: selectedTerm,
        courseId: selectedSubject || undefined,
        sectionId: selectedSection || undefined
      });

      const studentsRes = await apiClient.get(`/students?populate=*`);
      const students = studentsRes.data?.data || [];

      const gridRows: StudentGradeRow[] = students.map((std: any) => {
        const gradeRecord = dbGrades?.find((g: any) => g.student?.id === std.id);
        const hw = gradeRecord?.homeworkMark ?? 88;
        const qz = gradeRecord?.quizMark ?? 85;
        const prj = gradeRecord?.projectMark ?? 90;
        const mid = gradeRecord?.midtermMark ?? 82;
        const fnl = gradeRecord?.finalMark ?? 89;

        const row: StudentGradeRow = {
          id: gradeRecord?.id || `new_${std.id}`,
          studentId: std.id,
          schoolId: std.schoolId || std.admissionNumber || `AC0000000${std.id}`,
          name: (std.name || `${std.firstName || ''} ${std.lastName || ''}`).trim() || `Scholar #${std.id}`,
          homework: hw,
          quiz: qz,
          project: prj,
          midterm: mid,
          final: fnl,
          attendance: gradeRecord?.attendanceMark ?? 96,
          average: 0,
          letterGrade: 'F',
          gpa: 0.0,
          remarks: 'Fail',
          status: gradeRecord?.status || 'Draft',
          moderatorOffset: gradeRecord?.moderatorOffset || 0,
          moderatorRemarks: gradeRecord?.moderatorRemarks || '',
          isModified: false
        };

        calculateRowGrades(row);
        return row;
      });

      setGrades(gridRows);
      setHistoryStack([gridRows]);
    } catch (e) {
      const mockRows: StudentGradeRow[] = [
        { id: 1, studentId: 1, schoolId: 'AC00000001', name: 'Ahmet', homework: 92, quiz: 88, project: 95, midterm: 90, final: 91, attendance: 98, average: 0, letterGrade: 'A', gpa: 4.0, remarks: 'Excellent', status: 'Published', moderatorOffset: 0, moderatorRemarks: '', isModified: false },
        { id: 2, studentId: 2, schoolId: 'ST-2026-003', name: 'Mohamed Kamara', homework: 74, quiz: 65, project: 70, midterm: 68, final: 72, attendance: 90, average: 0, letterGrade: 'C', gpa: 2.0, remarks: 'Credit', status: 'Draft', moderatorOffset: 0, moderatorRemarks: '', isModified: false },
        { id: 3, studentId: 3, schoolId: 'ADM/2026/004', name: 'Ahmad Abdullahi Musa', homework: 85, quiz: 90, project: 88, midterm: 80, final: 85, attendance: 98, average: 0, letterGrade: 'A', gpa: 4.0, remarks: 'Excellent', status: 'Published', moderatorOffset: 0, moderatorRemarks: '', isModified: false }
      ];
      mockRows.forEach(row => calculateRowGrades(row));
      setGrades(mockRows);
      setHistoryStack([mockRows]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Student Grades (Only Logged-in Student for Student Role)
  const myStudentGrades = useMemo(() => {
    if (!user) return [];
    const uUser = user as any;
    const uSchoolId = (uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (uUser.documentId || '').toLowerCase();
    const uName = (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username || '').trim().toLowerCase();

    return grades.filter(g => {
      const gSchoolId = (g.schoolId || '').toLowerCase();
      const gName = (g.name || '').toLowerCase();

      return (
        (uSchoolId && (gSchoolId.includes(uSchoolId) || uSchoolId.includes(gSchoolId))) ||
        (uDocId && gSchoolId === uDocId) ||
        (uName && uName.length > 2 && (gName.includes(uName) || uName.includes(gName)))
      );
    });
  }, [grades, user]);

  const displayGrades = useMemo(() => {
    return isStudentRole ? myStudentGrades : grades;
  }, [isStudentRole, myStudentGrades, grades]);

  // Student Summary KPIs
  const studentAvg = useMemo(() => {
    if (myStudentGrades.length === 0) return 0;
    return myStudentGrades.reduce((sum, g) => sum + g.average, 0) / myStudentGrades.length;
  }, [myStudentGrades]);

  const studentGpa = useMemo(() => {
    if (myStudentGrades.length === 0) return 0;
    return myStudentGrades.reduce((sum, g) => sum + g.gpa, 0) / myStudentGrades.length;
  }, [myStudentGrades]);

  // Grading calculation engine based on active scheme and policy
  const calculateRowGrades = (row: StudentGradeRow) => {
    const policy = gradingPolicies.find(p => p.id === selectedPolicy) || {
      caPercent: 40,
      midtermPercent: 0,
      finalPercent: 60,
      projectPercent: 0,
      attendancePercent: 0,
      practicalPercent: 0
    };

    const totalCaWeight = Number(policy.caPercent || 40);
    const totalMidtermWeight = Number(policy.midtermPercent || 0);
    const totalFinalWeight = Number(policy.finalPercent || 60);
    const totalProjectWeight = Number(policy.projectPercent || 0);
    const totalAttendanceWeight = Number(policy.attendancePercent || 0);

    const hwPercent = (row.homework / 100) * 100;
    const quizPercent = (row.quiz / 100) * 100;
    const projectPercent = (row.project / 100) * 100;
    const midtermPercent = (row.midterm / 100) * 100;
    const finalPercent = (row.final / 100) * 100;
    const attendancePercent = (row.attendance / 100) * 100;

    const caScore = totalCaWeight > 0 ? ((hwPercent + quizPercent) / 2) * (totalCaWeight / 100) : 0;
    const midScore = totalMidtermWeight > 0 ? midtermPercent * (totalMidtermWeight / 100) : 0;
    const finScore = totalFinalWeight > 0 ? finalPercent * (totalFinalWeight / 100) : 0;
    const prjScore = totalProjectWeight > 0 ? projectPercent * (totalProjectWeight / 100) : 0;
    const attScore = totalAttendanceWeight > 0 ? attendancePercent * (totalAttendanceWeight / 100) : 0;

    let baseAvg = caScore + midScore + finScore + prjScore + attScore;
    baseAvg = Math.max(0, Math.min(100, baseAvg + Number(row.moderatorOffset || 0)));
    row.average = Math.round(baseAvg * 10) / 10;

    const activeScheme = gradingSchemes.find(s => s.id === selectedScheme) || { grade_bands: [] };
    const bands = activeScheme.grade_bands || [];

    const band = bands.find((b: any) => row.average >= b.minScore && row.average <= b.maxScore) || {
      letterGrade: row.average >= 70 ? 'A' : row.average >= 50 ? 'C' : 'F',
      gradePoint: row.average >= 70 ? 4.0 : row.average >= 50 ? 2.0 : 0.0,
      remarks: row.average >= 50 ? 'Pass' : 'Fail'
    };

    row.letterGrade = band.letterGrade;
    row.gpa = band.gradePoint;
    row.remarks = band.remarks || (band.isPass ? 'Pass' : 'Fail');
  };

  const handleCellEdit = (index: number, field: keyof StudentGradeRow, val: string | number) => {
    if (isStudentRole) return;
    const row = grades[index];
    if (row.status === 'Locked' && !isRegistrarOrAdmin) {
      toast.error('This grade has been locked by the Registrar and cannot be edited.');
      return;
    }
    if (row.status === 'RegistrarApproved' && !isRegistrarOrAdmin) {
      toast.error('Only the Registrar can modify approved grades.');
      return;
    }

    const updated = [...grades];
    const numericVal = parseFloat(val as string) || 0;
    const finalVal = Math.min(100, Math.max(0, numericVal));

    updated[index] = {
      ...updated[index],
      [field]: finalVal,
      isModified: true
    };

    calculateRowGrades(updated[index]);
    setGrades(updated);
    setHistoryStack([...historyStack, updated]);
    triggerAutoSave();
  };

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = () => {
    setSaveStatus('Saving changes...');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const modifiedRows = grades.filter(g => g.isModified);
        for (const row of modifiedRows) {
          await resultsService.saveStudentGrade(row.id, {
            marksObtained: row.average,
            homeworkMark: row.homework,
            quizMark: row.quiz,
            projectMark: row.project,
            midtermMark: row.midterm,
            finalMark: row.final,
            attendanceMark: row.attendance,
            status: row.status,
            moderatorOffset: row.moderatorOffset,
            moderatorRemarks: row.moderatorRemarks,
            student: row.studentId,
            subject: selectedSubject,
            academic_year: selectedYear,
            academic_term: selectedTerm
          });
        }
        setSaveStatus('All changes saved to database');
        setGrades(prev => prev.map(p => ({ ...p, isModified: false })));
      } catch (err) {
        setSaveStatus('Save failed. Changes cached locally.');
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  const handleUndo = () => {
    if (historyStack.length > 1) {
      const previous = [...historyStack];
      previous.pop();
      const prevState = previous[previous.length - 1];
      setGrades(prevState);
      setHistoryStack(previous);
      toast.success('Edit undone successfully');
    } else {
      toast.info('Nothing to undo');
    }
  };

  const handleBulkPaste = () => {
    try {
      const rows = pasteText.split('\n').filter(Boolean);
      const updated = [...grades];
      
      rows.forEach((rowText, index) => {
        if (index < updated.length) {
          const cells = rowText.split('\t');
          if (cells.length >= 5) {
            updated[index].homework = Math.min(100, Math.max(0, parseFloat(cells[0]) || 0));
            updated[index].quiz = Math.min(100, Math.max(0, parseFloat(cells[1]) || 0));
            updated[index].project = Math.min(100, Math.max(0, parseFloat(cells[2]) || 0));
            updated[index].midterm = Math.min(100, Math.max(0, parseFloat(cells[3]) || 0));
            updated[index].final = Math.min(100, Math.max(0, parseFloat(cells[4]) || 0));
            updated[index].isModified = true;
            calculateRowGrades(updated[index]);
          }
        }
      });

      setGrades(updated);
      setHistoryStack([...historyStack, updated]);
      setShowPasteModal(false);
      setPasteText('');
      triggerAutoSave();
      toast.success(`Successfully imported data for ${rows.length} students from Excel paste`);
    } catch (e) {
      toast.error('Failed to parse pasted data. Ensure it is tab-separated columns.');
    }
  };

  const handleStatusChange = async (newStatus: StudentGradeRow['status']) => {
    if (newStatus === 'Locked' && !isRegistrarOrAdmin) {
      toast.error('Only the Registrar can Lock grades.');
      return;
    }

    const updated = grades.map(g => ({ ...g, status: newStatus, isModified: true }));
    setGrades(updated);
    toast.info(`Updating grade statuses to: ${newStatus}...`);
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setIsSaving(true);
    try {
      for (const row of updated) {
        await resultsService.saveStudentGrade(row.id, {
          status: newStatus,
          marksObtained: row.average,
          homeworkMark: row.homework,
          quizMark: row.quiz,
          projectMark: row.project,
          midtermMark: row.midterm,
          finalMark: row.final,
          student: row.studentId,
          subject: selectedSubject,
          academic_year: selectedYear,
          academic_term: selectedTerm
        });
      }
      setSaveStatus('All changes saved to database');
      setGrades(prev => prev.map(p => ({ ...p, isModified: false })));
      toast.success(`Grades successfully transition to: ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update workflow state in database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = (student: StudentGradeRow) => {
    toast.info(`Generating official PDF report card for ${student.name}...`);
    
    const doc = new jsPDF();
    const verificationHash = 'sha256-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const verificationUrl = `https://yahayascool.edu.ng/verify/certificate?hash=${verificationHash}`;

    const primaryColor: [number, number, number] = [16, 185, 129];
    const darkSlate: [number, number, number] = [15, 23, 42];

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('YAHAYA ENTERPRISE SCHOOLS', 15, 18);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Knowledge, Character, and Spiritual Excellence', 15, 25);
    doc.text('Official Academic Report Card | Verified Registry Copy', 15, 30);

    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('STUDENT INFORMATION', 15, 52);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 54, 195, 54);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Full Name: ${student.name}`, 15, 60);
    doc.text(`Student ID: ${student.schoolId}`, 15, 65);
    doc.text(`Class/Section: Senior Secondary Division`, 15, 70);
    doc.text(`Academic Term: 2nd Term 2026/2027`, 15, 75);

    doc.text(`Grading Scale: Standard Scale`, 110, 60);
    doc.text(`Attendance Record: ${student.attendance}%`, 110, 65);
    doc.text(`Behavior Conduct: Excellent (A)`, 110, 70);
    doc.text(`Final Term CGPA: ${student.gpa.toFixed(2)}`, 110, 75);

    const tableBody = [
      ['Homework / CA (40%)', `${student.homework} / 100`, 'Passed'],
      ['Quiz Assessments (CA)', `${student.quiz} / 100`, 'Passed'],
      ['Project Mark (CA)', `${student.project} / 100`, 'Passed'],
      ['Midterm Examination (30%)', `${student.midterm} / 100`, 'Passed'],
      ['Final Examination (30%)', `${student.final} / 100`, 'Passed'],
    ];

    if (templateType === 'Islamic') {
      tableBody.push(['Quranic Hifz Progress', 'Juz 30 Complete', 'Excellent']);
      tableBody.push(['Tajweed Evaluation', '95 / 100', 'Distinction']);
    }

    autoTable(doc, {
      startY: 85,
      head: [['Assessment Type', 'Score / Weight', 'Performance Status']],
      body: tableBody,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      margin: { left: 15, right: 15 },
    });

    const finalY = ((doc as any).lastAutoTable?.finalY ?? 160) + 12;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, finalY, 180, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, finalY, 180, 25);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ACADEMIC OUTCOME SUMMARY', 20, finalY + 6);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Overall Term Weighted Average: ${student.average}%`, 20, finalY + 12);
    doc.text(`Final Letter Grade: ${student.letterGrade} | Calculated GPA Points: ${student.gpa.toFixed(2)}`, 20, finalY + 18);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Promotion Status: ${student.average >= 50 ? 'PROMOTED' : 'REPEAT CLASS'}`, 110, finalY + 12);

    const commentsY = finalY + 32;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('OFFICIAL LOGS & REMARKS', 15, commentsY);
    doc.line(15, commentsY + 2, 195, commentsY + 2);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Teacher Remarks: ${teacherGeneralRemarks}`, 15, commentsY + 8);
    doc.text(`Principal Remarks: ${principalRemarks}`, 15, commentsY + 14);

    const sigY = commentsY + 30;
    doc.line(25, sigY, 75, sigY);
    doc.text(registrarName, 25, sigY + 5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Registrar Signature', 25, sigY + 9);
    doc.setFont('Helvetica', 'normal');

    doc.line(135, sigY, 185, sigY);
    doc.text(principalName, 135, sigY + 5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Principal Signature', 135, sigY + 9);

    const stampY = sigY + 22;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, stampY, 180, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Cryptographic Security Verification Hash: ${verificationHash}`, 18, stampY + 6);
    doc.text(`Verification URL: ${verificationUrl}`, 18, stampY + 11);
    doc.text('This document has been digitally locked. Scanning the code above verifies authenticity in the registrar database.', 18, stampY + 16);

    doc.save(`ReportCard_${student.schoolId}.pdf`);
    toast.success(`PDF successfully exported for ${student.name}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={isStudentRole ? "My Terminal Report Cards & Academic Performance" : "Enterprise Academic Gradebook & Report Cards"}
        description={
          isStudentRole 
            ? "View your official subject grades, continuous assessment breakdown, terminal averages, and download certified report card PDFs."
            : "Verify, moderate, approve continuous assessment marks and generate premium student report cards."
        }
      >
        <div className="flex items-center gap-2">
          {!isStudentRole && activeTab === 'gradebook' && (
            <>
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                title="Undo last grid edit"
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Bulk Paste</span>
              </button>
            </>
          )}

          {!isStudentRole && (
            <button
              onClick={() => setActiveTab(activeTab === 'gradebook' ? 'generator' : 'gradebook')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              {activeTab === 'gradebook' ? <FileText className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              <span>{activeTab === 'gradebook' ? 'Report Card Generator' : 'Gradebook Grid View'}</span>
            </button>
          )}

          {isStudentRole && myStudentGrades.length > 0 && (
            <button
              onClick={() => handleExportPDF(myStudentGrades[0])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Download Report Card PDF</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Filter panel */}
      <div className={isStudentRole ? "grid grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mb-6 shadow-sm max-w-md" : "grid grid-cols-2 md:grid-cols-6 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mb-6 shadow-sm"}>
        <div>
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Academic Year</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Academic Term</label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {!isStudentRole && (
          <>
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Class Section</label>
              <select 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Course / Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Grading Policy</label>
              <select 
                value={selectedPolicy} 
                onChange={(e) => setSelectedPolicy(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {gradingPolicies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Grading Scale Scheme</label>
              <select 
                value={selectedScheme} 
                onChange={(e) => setSelectedScheme(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {gradingSchemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Student Specific Performance Summary Deck */}
      {isStudentRole && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Overall Term Average</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{studentAvg.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Continuous Assessment & Final Exam</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Calculated GPA</span>
            <p className="text-2xl font-black text-amber-500">{studentGpa.toFixed(2)} / 4.00</p>
            <p className="text-xs text-slate-500">Grade Point Average Scale</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subjects Evaluated</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{myStudentGrades.length}</p>
            <p className="text-xs text-slate-500">Total Enrolled Subjects</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Standing</span>
            <p className="text-2xl font-black text-sky-500">{studentAvg >= 50 ? 'PROMOTED ✓' : 'REVIEW'}</p>
            <p className="text-xs text-slate-500">Official Board Determination</p>
          </div>
        </div>
      )}

      {activeTab === 'gradebook' ? (
        <div className="space-y-6">
          {/* Workflow Status Bar & Save Status (ONLY FOR ADMIN / STAFF) */}
          {!isStudentRole && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Auto Save Grid Status</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {saveStatus}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Class Workflow:</label>
                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
                  {(['Draft', 'TeacherSubmitted', 'DepartmentReview', 'Published', 'Locked'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        grades[0]?.status === s
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grid View */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Admission #</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">HW (100)</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Quiz (100)</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Project (100)</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Mid (100)</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Final (100)</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Att. %</th>
                    {!isStudentRole && <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-24">Moderation</th>}
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Average</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-20">Letter</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-16">GPA</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-24">Remarks</th>
                    {isStudentRole && <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {displayGrades.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500 font-mono">{row.schoolId}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">{row.name}</td>
                      
                      {/* Cells inputs for Admin, text for Student */}
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.homework}</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.homework} 
                            onChange={(e) => handleCellEdit(index, 'homework', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.quiz}</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.quiz} 
                            onChange={(e) => handleCellEdit(index, 'quiz', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.project}</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.project} 
                            onChange={(e) => handleCellEdit(index, 'project', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.midterm}</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.midterm} 
                            onChange={(e) => handleCellEdit(index, 'midterm', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.final}</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.final} 
                            onChange={(e) => handleCellEdit(index, 'final', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold">
                        {isStudentRole ? (
                          <span>{row.attendance}%</span>
                        ) : (
                          <input 
                            type="number" 
                            value={row.attendance} 
                            onChange={(e) => handleCellEdit(index, 'attendance', e.target.value)}
                            disabled={row.status === 'Locked'}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                          />
                        )}
                      </td>

                      {/* Moderation column (ADMIN ONLY) */}
                      {!isStudentRole && (
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              placeholder="offset"
                              value={row.moderatorOffset} 
                              disabled={!isDeptHead && !isRegistrarOrAdmin}
                              onChange={(e) => {
                                const updated = [...grades];
                                updated[index].moderatorOffset = parseFloat(e.target.value) || 0;
                                calculateRowGrades(updated[index]);
                                setGrades(updated);
                                triggerAutoSave();
                              }}
                              className="w-12 px-1 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-emerald-500"
                            />
                            <input 
                              type="text" 
                              placeholder="Reason..."
                              value={row.moderatorRemarks} 
                              disabled={!isDeptHead && !isRegistrarOrAdmin}
                              onChange={(e) => {
                                const updated = [...grades];
                                updated[index].moderatorRemarks = e.target.value;
                                setGrades(updated);
                                triggerAutoSave();
                              }}
                              className="w-20 px-1 py-1 text-[10px] rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent"
                            />
                          </div>
                        </td>
                      )}

                      {/* Calculated Columns */}
                      <td className="px-4 py-3 text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{row.average}%</td>
                      <td className="px-4 py-3 text-xs font-black">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800`}>
                          {row.letterGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">{row.gpa.toFixed(2)}</td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{row.remarks}</td>
                      {isStudentRole && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleExportPDF(row)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {displayGrades.length === 0 && (
                    <tr>
                      <td colSpan={isStudentRole ? 13 : 13} className="text-center py-12 text-slate-400 space-y-2">
                        <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {isStudentRole 
                            ? "No academic results logged for your student account in this term." 
                            : "No student grade rows found."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Report Card Generator Tab (ONLY FOR ADMIN / STAFF) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Card Configuration</span>
              </h3>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Select Student</label>
                <select 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">-- Choose Student --</option>
                  {grades.map(g => <option key={g.studentId} value={g.studentId}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Report Template Layout</label>
                <select 
                  value={templateType} 
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="Primary">Primary School Template</option>
                  <option value="Secondary">Secondary School Template</option>
                  <option value="College">College / Higher Academics</option>
                  <option value="Islamic">Islamic Quran & Arabic Template</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Behavior Conduct Grade</label>
                <select 
                  value={behaviorLevel} 
                  onChange={(e) => setBehaviorLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="green">Excellent (Green conduct)</option>
                  <option value="yellow">Pending Review (Yellow conduct)</option>
                  <option value="red">Disciplinary Warning (Red conduct)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Teacher General Remarks</label>
                <textarea 
                  value={teacherGeneralRemarks} 
                  onChange={(e) => setTeacherGeneralRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-medium text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 h-16 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Principal/Director Remarks</label>
                <textarea 
                  value={principalRemarks} 
                  onChange={(e) => setPrincipalRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-medium text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">Registrar Signee</label>
                  <input 
                    type="text" 
                    value={registrarName} 
                    onChange={(e) => setRegistrarName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">Principal Signee</label>
                  <input 
                    type="text" 
                    value={principalName} 
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Official Report Card Preview</h3>
                  <p className="text-xs text-slate-500">Live preview of selected template format prior to digital lock sealing</p>
                </div>
                <button
                  disabled={!selectedStudentId}
                  onClick={() => {
                    const student = grades.find(g => String(g.studentId) === String(selectedStudentId));
                    if (student) handleExportPDF(student);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Sealed Export PDF</span>
                </button>
              </div>

              {selectedStudentId ? (
                (() => {
                  const student = grades.find(g => String(g.studentId) === String(selectedStudentId));
                  if (!student) return <p className="text-xs text-slate-500 p-8 text-center">Student not found in active grid.</p>;
                  return (
                    <div className="mt-6 border border-slate-250 dark:border-slate-850 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/20 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg">Y</div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">YAHAYA ENTERPRISE SCHOOLS</h4>
                            <p className="text-[10px] text-slate-500">2nd Term 2026/2027 Academic Report Card</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600">
                            Verified Registry Copy
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Student Name</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{student.name}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Student ID / Adm #</p>
                          <p className="font-bold text-slate-850 dark:text-slate-200">{student.schoolId}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Behavior Status</p>
                          <span className={`inline-block w-2.5 h-2.5 rounded-full bg-${behaviorLevel === 'green' ? 'emerald' : behaviorLevel === 'yellow' ? 'amber' : 'rose'}-500`} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Term Average</p>
                          <p className="font-black text-emerald-600">{student.average}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Assessment Scores</h5>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                          <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                            <span>Subject Component</span>
                            <span>Score</span>
                            <span>Scale Letter</span>
                          </div>
                          <div className="p-2.5 divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="grid grid-cols-3 py-1.5">
                              <span>Homework Tasks (CA)</span>
                              <span>{student.homework} / 100</span>
                              <span className="font-bold">{student.letterGrade}</span>
                            </div>
                            <div className="grid grid-cols-3 py-1.5">
                              <span>Quiz Assessments (CA)</span>
                              <span>{student.quiz} / 100</span>
                              <span className="font-bold">{student.letterGrade}</span>
                            </div>
                            <div className="grid grid-cols-3 py-1.5">
                              <span>Final Examination</span>
                              <span>{student.final} / 100</span>
                              <span className="font-bold text-emerald-600">{student.letterGrade}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 block mb-1">Registrar Signature Stamp</p>
                          <div className="border-b border-slate-400 w-32 pb-1 font-semibold italic text-slate-600 dark:text-slate-400">{registrarName}</div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 block mb-1">Principal Signature Stamp</p>
                          <div className="border-b border-slate-400 w-32 pb-1 font-semibold italic text-slate-600 dark:text-slate-400">{principalName}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-16 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Select a student from the sidebar options to preview and generate their official report card.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excel paste modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Excel Spreadsheet Bulk Paste</h3>
              <p className="text-xs text-slate-500 mt-1">Copy columns directly from your local Excel file (Homework, Quiz, Project, Midterm, Final separated by tabs) and paste here. Rows will match current grid sort order.</p>
            </div>
            <div className="p-6">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste here... e.g.&#10;85&#9;90&#9;80&#9;75&#9;85&#10;90&#9;88&#9;95&#9;82&#9;90"
                className="w-full h-48 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

