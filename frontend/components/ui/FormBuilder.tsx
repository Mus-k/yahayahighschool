'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Loader2, Plus, Trash2, AlertCircle, CheckCircle2,
  FileUp, Globe, Eye, EyeOff, Calendar, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface FormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'time' | 'file' | 'repeatable' | 'i18n-text';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: any;
  helperText?: string;
  condition?: { field: string; value: any };
  repeatableSchema?: FormFieldDef[];
}

interface FormBuilderProps {
  fields: FormFieldDef[];
  onSubmit: (data: any) => Promise<void> | void;
  initialValues?: Record<string, any>;
  draftKey?: string;
  submitLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export function FormBuilder({
  fields,
  onSubmit,
  initialValues = {},
  draftKey,
  submitLabel = 'Save Record',
  isLoading = false,
  className,
}: FormBuilderProps) {
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Load draft from localStorage if present
  const mergedInitialValues = React.useMemo(() => {
    if (!draftKey || typeof window === 'undefined') return initialValues;
    try {
      const draft = localStorage.getItem(`form_draft_${draftKey}`);
      if (draft) {
        return { ...initialValues, ...JSON.parse(draft) };
      }
    } catch (e) { /* ignore */ }
    return initialValues;
  }, [draftKey, initialValues]);

  // Build dynamic Zod schema based on fields definition
  const schema = React.useMemo(() => {
    const shape: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.type === 'checkbox') {
        shape[field.name] = z.boolean().optional();
      } else if (field.type === 'number') {
        shape[field.name] = field.required
          ? z.coerce.number().min(0, `${field.label} is required`)
          : z.coerce.number().optional();
      } else if (field.type === 'email') {
        shape[field.name] = field.required
          ? z.string().email('Invalid email address')
          : z.string().email('Invalid email address').optional().or(z.literal(''));
      } else if (field.type === 'repeatable') {
        shape[field.name] = z.array(z.any()).optional();
      } else {
        shape[field.name] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
      }
    });
    return z.object(shape);
  }, [fields]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: mergedInitialValues,
  });

  const formValues = watch();

  // Auto-save draft every 5 seconds if dirty and draftKey provided
  useEffect(() => {
    if (!draftKey || !isDirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`form_draft_${draftKey}`, JSON.stringify(formValues));
        setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) { /* ignore */ }
    }, 3000);
    return () => clearTimeout(timer);
  }, [formValues, isDirty, draftKey]);

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      if (draftKey) {
        localStorage.removeItem(`form_draft_${draftKey}`);
        setDraftSavedTime(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving form data');
    }
  };

  const clearDraft = () => {
    if (draftKey) {
      localStorage.removeItem(`form_draft_${draftKey}`);
      setDraftSavedTime(null);
      reset(initialValues);
      toast.info('Form reset and draft cleared');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-5', className)}>
      {/* Draft Notification Banner */}
      {draftSavedTime && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Draft automatically saved at {draftSavedTime}</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs underline hover:text-primary/80 transition-colors"
          >
            Clear Draft
          </button>
        </div>
      )}

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          // Check conditional field visibility
          if (field.condition) {
            const watchedValue = formValues[field.condition.field];
            if (watchedValue !== field.condition.value) return null;
          }

          const error = errors[field.name]?.message as string | undefined;

          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="md:col-span-2 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span>{field.label}</span>
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  {...register(field.name)}
                  rows={4}
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                    error ? 'border-destructive ring-destructive/20' : 'border-border'
                  )}
                />
                {error && <p className="text-[11px] font-medium text-destructive mt-0.5">{error}</p>}
                {field.helperText && !error && <p className="text-[11px] text-muted-foreground">{field.helperText}</p>}
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.name} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span>{field.label}</span>
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                <select
                  {...register(field.name)}
                  className={cn(
                    'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                    error ? 'border-destructive ring-destructive/20' : 'border-border'
                  )}
                >
                  <option value="">Select option...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {error && <p className="text-[11px] font-medium text-destructive mt-0.5">{error}</p>}
              </div>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id={field.name}
                  {...register(field.name)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <label htmlFor={field.name} className="text-sm font-medium text-foreground cursor-pointer">
                  {field.label}
                </label>
              </div>
            );
          }

          if (field.type === 'i18n-text') {
            return (
              <div key={field.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <span>{field.label}</span>
                    {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Globe className="w-3 h-3" /> Strapi i18n
                  </span>
                </div>
                <input
                  type="text"
                  {...register(field.name)}
                  placeholder={field.placeholder || 'Multilingual input (en, ar...)'}
                  className={cn(
                    'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                    error ? 'border-destructive ring-destructive/20' : 'border-border'
                  )}
                />
                {error && <p className="text-[11px] font-medium text-destructive mt-0.5">{error}</p>}
              </div>
            );
          }

          return (
            <div key={field.name} className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <span>{field.label}</span>
                {field.required && <span className="text-destructive">*</span>}
              </label>
              <input
                type={field.type}
                {...register(field.name)}
                placeholder={field.placeholder}
                className={cn(
                  'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                  error ? 'border-destructive ring-destructive/20' : 'border-border'
                )}
              />
              {error && <p className="text-[11px] font-medium text-destructive mt-0.5">{error}</p>}
              {field.helperText && !error && <p className="text-[11px] text-muted-foreground">{field.helperText}</p>}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {draftKey && isDirty && (
          <button
            type="button"
            onClick={clearDraft}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors"
          >
            Discard Changes
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
