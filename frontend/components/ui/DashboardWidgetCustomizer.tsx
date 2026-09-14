'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Eye, EyeOff, Pin, RotateCcw,
  Check, X, GripVertical, Maximize2, Minimize2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface WidgetConfig {
  id: string;
  title: string;
  layer: 'summary' | 'chart' | 'action';
  isVisible: boolean;
  isPinned: boolean;
  size: 'normal' | 'large' | 'full';
}

interface DashboardWidgetCustomizerProps {
  role: string;
  defaultWidgets: WidgetConfig[];
  onUpdate: (widgets: WidgetConfig[]) => void;
}

export function DashboardWidgetCustomizer({
  role,
  defaultWidgets,
  onUpdate,
}: DashboardWidgetCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);

  const storageKey = `dashboard_layout_${role}`;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const defaultWidgetsRef = useRef(defaultWidgets);
  defaultWidgetsRef.current = defaultWidgets;

  // Load saved layout from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWidgets(parsed);
        onUpdateRef.current(parsed);
      } else {
        setWidgets(defaultWidgetsRef.current);
        onUpdateRef.current(defaultWidgetsRef.current);
      }
    } catch (e) {
      setWidgets(defaultWidgetsRef.current);
    }
  }, [role, storageKey]);

  const handleToggleVisibility = (id: string) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, isVisible: !w.isVisible } : w
    );
    setWidgets(updated);
    savePreferences(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, isPinned: !w.isPinned } : w
    );
    // Move pinned items to the top of their layer
    setWidgets(updated);
    savePreferences(updated);
  };

  const handleResize = (id: string) => {
    const updated: WidgetConfig[] = widgets.map((w) => {
      if (w.id !== id) return w;
      const nextSize: WidgetConfig['size'] = w.size === 'normal' ? 'large' : w.size === 'large' ? 'full' : 'normal';
      return { ...w, size: nextSize } as WidgetConfig;
    });
    setWidgets(updated);
    savePreferences(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...widgets];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setWidgets(updated);
    savePreferences(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const updated = [...widgets];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setWidgets(updated);
    savePreferences(updated);
  };

  const savePreferences = (layout: WidgetConfig[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (e) { /* ignore */ }
    onUpdate(layout);
  };

  const restoreDefaults = () => {
    localStorage.removeItem(storageKey);
    setWidgets(defaultWidgets);
    onUpdate(defaultWidgets);
    toast.success('Default dashboard layout restored');
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
        <span>Customize Dashboard</span>
      </button>

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <span>Dashboard Customization ({role})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pin, resize, hide, or rearrange widgets to match your preferences.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Widgets List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {widgets.map((widget, idx) => (
                  <div
                    key={widget.id}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all',
                      widget.isVisible ? 'bg-background border-border shadow-sm' : 'bg-muted/40 border-dashed border-border opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === widgets.length - 1}
                          className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {widget.title}
                          </span>
                          {widget.isPinned && (
                            <Pin className="w-3 h-3 text-primary fill-primary" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Layer: {widget.layer} • Size: {widget.size}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {/* Pin */}
                      <button
                        onClick={() => handleTogglePin(widget.id)}
                        title="Pin widget"
                        className={cn(
                          'p-1.5 rounded-lg border transition-colors',
                          widget.isPinned
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-transparent hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Resize */}
                      <button
                        onClick={() => handleResize(widget.id)}
                        title={`Resize (${widget.size})`}
                        className="p-1.5 rounded-lg border border-transparent hover:bg-muted text-muted-foreground transition-colors"
                      >
                        {widget.size === 'full' ? (
                          <Minimize2 className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Visibility */}
                      <button
                        onClick={() => handleToggleVisibility(widget.id)}
                        title={widget.isVisible ? 'Hide widget' : 'Show widget'}
                        className={cn(
                          'p-1.5 rounded-lg border transition-colors',
                          !widget.isVisible
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-transparent hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {widget.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={restoreDefaults}
                  className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Layout</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    savePreferences(widgets);
                    setIsOpen(false);
                    toast.success('Dashboard layout saved');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
