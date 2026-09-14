/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Plus, Book, Compass, Library, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';

export default function CurriculumPage() {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | number>('');
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // New topic state
  const [newTitle, setNewTitle] = useState('');
  const [newUnitName, setNewUnitName] = useState('Unit 1: Introduction');
  const [newDesc, setNewDesc] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newHours, setNewHours] = useState('4');
  const [newTextbook, setNewTextbook] = useState('');

  const loadCurriculums = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/curriculums', {
        params: {
          populate: ['subject', 'gradeLevels'],
          'pagination[limit]': 100
        }
      });
      const list = res.data?.data || [];
      setCurriculums(list);
      if (list.length > 0) {
        setSelectedCurriculumId(list[0].id);
      }
    } catch (e) {
      toast.error('Failed to load Curriculums');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopics = async () => {
    if (!selectedCurriculumId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/topics', {
        params: {
          'filters[curriculum][id][$eq]': selectedCurriculumId,
          'sort': 'orderNumber:asc',
          'pagination[limit]': 100
        }
      });
      const list = res.data?.data || [];
      setTopics(list);

      // Default expand all units
      const units: Record<string, boolean> = {};
      list.forEach((t: any) => {
        const uName = t.teachingMethod || 'General Unit'; // Group by teachingMethod field acting as Unit Name
        units[uName] = true;
      });
      setExpandedUnits(units);
    } catch (e) {
      toast.error('Failed to load curriculum syllabus');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculums();
  }, []);

  useEffect(() => {
    if (selectedCurriculumId) {
      loadTopics();
    }
  }, [selectedCurriculumId]);

  const toggleUnit = (uName: string) => {
    setExpandedUnits(prev => ({ ...prev, [uName]: !prev[uName] }));
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await apiClient.post('/topics', {
        data: {
          title: newTitle.trim(),
          description: newDesc,
          learningObjectives: newObjectives,
          estimatedTime: `${newHours} Hours`,
          teachingMethod: newUnitName.trim(), // Storing unit name in teachingMethod field
          completionStatus: 'Pending',
          orderNumber: topics.length + 1,
          curriculum: Number(selectedCurriculumId)
        }
      });
      toast.success('Curriculum learning outcome mapped successfully!');
      setIsModalOpen(false);
      // Reset
      setNewTitle('');
      setNewDesc('');
      setNewObjectives('');
      setNewHours('4');
      setNewTextbook('');
      loadTopics();
    } catch (err) {
      toast.error('Failed to map new topic');
    }
  };

  // Group topics by Unit Name (teachingMethod field)
  const groupedTopics = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    topics.forEach(t => {
      const uName = t.teachingMethod || 'Unit 1: Core Fundamentals';
      if (!groups[uName]) groups[uName] = [];
      groups[uName].push(t);
    });
    return groups;
  }, [topics]);

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum & Learning Outcome Mapping"
        description="Design structural pathways, map subjects to learning outcomes, and detail weekly core objectives."
      >
        <div className="flex items-center gap-3">
          <select
            value={selectedCurriculumId}
            onChange={(e) => setSelectedCurriculumId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-card text-foreground focus:outline-none text-xs font-bold w-60"
          >
            {curriculums.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.subject?.name || 'General'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition shadow-sm cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Map Outcome</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800 dark:text-slate-100">
        
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              <span>Curriculum Overview</span>
            </h3>
            
            {selectedCurriculumId && (
              <div className="space-y-3 font-medium">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Curriculum Pathway</span>
                  <span className="text-foreground font-bold">{curriculums.find(c => c.id === Number(selectedCurriculumId))?.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Assigned Subject</span>
                  <span className="text-foreground font-bold">
                    {curriculums.find(c => c.id === Number(selectedCurriculumId))?.subject?.name || 'All'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Version Control</span>
                  <span className="text-foreground font-mono">v{curriculums.find(c => c.id === Number(selectedCurriculumId))?.version || '1.0.0'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Curriculum Credits</span>
                  <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold">
                    {curriculums.find(c => c.id === Number(selectedCurriculumId))?.credits || 3} Credits
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tree Node Syllabus map */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
              Loading mapped syllabus units...
            </div>
          ) : Object.keys(groupedTopics).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
              No learning outcomes are currently mapped to this curriculum pathway. Click "Map Outcome" above to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedTopics).map(([unitName, items]) => {
                const isOpen = !!expandedUnits[unitName];
                return (
                  <div key={unitName} className="border border-border rounded-xl bg-card overflow-hidden transition shadow-sm">
                    <button
                      onClick={() => toggleUnit(unitName)}
                      className="w-full flex items-center justify-between p-4 bg-muted/20 border-b border-border text-left font-bold text-foreground cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        <span>{unitName}</span>
                      </div>
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{items.length} Outcomes</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-border">
                        {items.map((topic, idx) => (
                          <div key={topic.id} className="p-4 flex gap-4 hover:bg-muted/10 transition">
                            <span className="font-bold text-muted-foreground font-mono text-xs pt-0.5">
                              #{idx + 1}
                            </span>
                            <div className="space-y-1.5 flex-1">
                              <h4 className="font-bold text-foreground text-xs">{topic.title}</h4>
                              {topic.description && (
                                <p className="text-muted-foreground leading-relaxed">{topic.description}</p>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-border text-[11px]">
                                <div>
                                  <strong className="text-foreground block font-bold mb-0.5">Learning Objective</strong>
                                  <span className="text-slate-500">{topic.learningObjectives || 'N/A'}</span>
                                </div>
                                <div>
                                  <strong className="text-foreground block font-bold mb-0.5">Estimated Duration</strong>
                                  <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold font-mono">
                                    {topic.estimatedTime || '4 Hours'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map Outcome Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-slide-up text-xs font-bold">
            <h3 className="text-lg font-black text-foreground mb-1">Map Learning Outcome</h3>
            <p className="text-xs text-muted-foreground mb-5 font-medium">Add a unit syllabus topic, target delivery hours, and required objectives.</p>
            
            <form onSubmit={handleAddTopic} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-slate-500">Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 1: Introduction to Tajweed"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Outcome Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pronunciation of throat letters"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specify syllabus details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Learning Objectives</label>
                <input
                  type="text"
                  placeholder="e.g. Student must accurately identify Huroof-al-Halq"
                  value={newObjectives}
                  onChange={(e) => setNewObjectives(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500">Required Hours</label>
                  <input
                    type="number"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">Required Textbook</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Qaidah An-Noraniah"
                    value={newTextbook}
                    onChange={(e) => setNewTextbook(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold cursor-pointer transition shadow-md border-none"
              >
                Save Outcome mapping
              </button>
            </form>

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
