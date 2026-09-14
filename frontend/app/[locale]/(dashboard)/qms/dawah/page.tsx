'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, MapPin, User, Users } from 'lucide-react';
import { qmsService } from '@/services/qms.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import type { DawahActivity } from '@/types/qms.types';
import { toast } from 'sonner';

export default function DawahActivitiesPage() {
  const [activities, setActivities] = useState<DawahActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await qmsService.getDawahActivities();
        setActivities(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load Da\'wah activities.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <EnterpriseModuleShell
      title="Da'wah Activities"
      description="Manage community outreach, mosque programs, and Islamic awareness campaigns organized by the institution."
      breadcrumbs={[{ label: 'QMS', href: '/qms' }, { label: 'Da\'wah Activities' }]}
      icon={<Megaphone className="w-8 h-8" />}
      recordCount={activities.length}
      recordLabel="Active Programs"
    >
      {loading ? (
        <div className="flex items-center justify-center p-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activities.map((activity) => {
            const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
            const photoUrl = activity.photos?.[0]?.url 
              ? (activity.photos[0].url.startsWith('http') ? activity.photos[0].url : `${baseUrl}${activity.photos[0].url}`)
              : null;
              
            return (
              <div key={activity.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                {photoUrl ? (
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                    <img src={photoUrl} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-slate-50 flex flex-col items-center justify-center shrink-0 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                      <Megaphone className="w-8 h-8 text-emerald-300" />
                    </div>
                  </div>
                )}
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">{activity.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{activity.description}</p>
                  </div>
                  
                  <div className="space-y-2.5 text-xs font-medium text-slate-600 mt-auto bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{new Date(activity.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="line-clamp-1">{activity.location}</span>
                      </div>
                    )}
                    {activity.teacher && (
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="line-clamp-1">{activity.teacher.name} <span className="text-slate-400 font-normal">(Coordinator)</span></span>
                      </div>
                    )}
                    {activity.students && activity.students.length > 0 && (
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{activity.students.length} Student Volunteers</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {activities.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Megaphone className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Da'wah Activities Found</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">There are currently no active Da'wah programs scheduled in the system. Check back later or add new activities in the CMS.</p>
            </div>
          )}
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
