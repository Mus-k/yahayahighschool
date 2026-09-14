"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { ClipboardList, Calendar, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface AttendanceRecord {
  documentId: string;
  date: string;
  status: string;
  comments?: string;
  student?: { user?: { firstName: string; lastName: string } };
  subject?: { name: string };
  teacher?: { name: string; displayName?: string };
}

export default function AttendancePage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/attendance-records", {
          params: {
            filters: { section: { documentId: { $eq: sectionId } } },
            populate: ["student.user", "teacher", "subject", "courseOffering"],
            sort: ["date:desc"],
            pagination: { limit: 100 }
          },
        });
        setRecords(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAttendance();
  }, [sectionId]);

  // Summarize stats
  const stats = records.reduce((acc, curr) => {
    const stat = curr.status.toLowerCase();
    if (stat === 'present') acc.present++;
    else if (stat === 'absent') acc.absent++;
    else if (stat === 'late') acc.late++;
    else if (stat === 'excused') acc.excused++;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0 });

  const total = records.length || 1; // avoid division by zero
  const getPercent = (val: number) => Math.round((val / total) * 100);

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'present': return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle className="h-3 w-3"/> Present</span>;
      case 'absent': return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400"><XCircle className="h-3 w-3"/> Absent</span>;
      case 'late': return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"><Clock className="h-3 w-3"/> Late</span>;
      case 'excused': return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">Excused</span>;
      default: return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-400">{status}</span>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-indigo-500" />
              Attendance Records
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Recent attendance logs for {section?.name || "this section"}.
            </p>
          </div>
          <Link
            href="/lms/attendance"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Record Attendance
          </Link>
        </div>

        <SectionSubNav activeTab="attendance" sectionId={sectionId} />

        {/* Stats Summary */}
        {!isLoading && records.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Present</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{getPercent(stats.present)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Absent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{getPercent(stats.absent)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Late</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{getPercent(stats.late)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Excused</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{getPercent(stats.excused)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Attendance Records Found</h3>
            <p className="text-slate-500 mt-2 mb-6 max-w-md">There are no attendance records for this section yet. Use the LMS attendance console to record attendance.</p>
            <Link
              href="/lms/attendance"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Record Attendance
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Teacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((record) => (
                    <tr key={record.documentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {record.student?.user?.firstName} {record.student?.user?.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {record.subject?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {record.teacher?.displayName || record.teacher?.name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
