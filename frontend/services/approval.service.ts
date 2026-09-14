import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import type { ApprovalWorkflow } from '@/types/enterprise.types';
import { NotificationChannelEnum, NotificationPriorityEnum } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Reusable Enterprise Approval Engine
// Handles multi-level departmental & financial approvals
// ─────────────────────────────────────────────────────────────────────────────

export const approvalService = {
  /**
   * Initializes a configurable multi-step approval workflow.
   */
  createWorkflow(
    documentNumber: string,
    module: ApprovalWorkflow['module'],
    steps: { stepName: string; assignedRole: string }[]
  ): ApprovalWorkflow {
    return {
      id: `WF-${Date.now()}`,
      documentNumber,
      module,
      currentStep: steps[0]?.stepName || 'Initial Review',
      steps: steps.map(s => ({
        stepName: s.stepName,
        assignedRole: s.assignedRole,
        approved: false,
      })),
      isCompleted: false,
      isRejected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Processes an approval step by an authorized role.
   */
  async approveStep(
    workflow: ApprovalWorkflow,
    approvedBy: string,
    approvedByRole: string,
    comments?: string
  ): Promise<{ updatedWorkflow: ApprovalWorkflow; nextStepName: string | null; isFinal: boolean }> {
    const nextUnapprovedIndex = workflow.steps.findIndex(s => !s.approved);
    
    if (nextUnapprovedIndex === -1) {
      return { updatedWorkflow: workflow, nextStepName: null, isFinal: true };
    }

    const updatedSteps = [...workflow.steps];
    updatedSteps[nextUnapprovedIndex] = {
      ...updatedSteps[nextUnapprovedIndex],
      approved: true,
      approvedBy,
      approvedAt: new Date().toISOString(),
      comments,
    };

    const isFinal = nextUnapprovedIndex === workflow.steps.length - 1;
    const nextStepName = isFinal ? 'COMPLETED' : workflow.steps[nextUnapprovedIndex + 1].stepName;

    const updatedWorkflow: ApprovalWorkflow = {
      ...workflow,
      steps: updatedSteps,
      currentStep: nextStepName,
      isCompleted: isFinal,
      updatedAt: new Date().toISOString(),
    };

    // Log Audit
    await auditService.logAction({
      action: `WORKFLOW_APPROVED_${workflow.module.toUpperCase()}`,
      entity: 'Workflow',
      description: `Approved step ${workflow.steps[nextUnapprovedIndex].stepName} for document ${workflow.documentNumber}`,
      metadata: { approvedBy, role: approvedByRole, comments }
    });

    // Trigger Notification
    await notificationService.sendNotification({
      recipientId: 1,
      title: `Approval Progress: ${workflow.documentNumber}`,
      body: `Step '${workflow.steps[nextUnapprovedIndex].stepName}' approved by ${approvedBy}. Current Status: ${nextStepName}`,
      channel: NotificationChannelEnum.Dashboard,
      priority: NotificationPriorityEnum.Normal
    });

    return { updatedWorkflow, nextStepName, isFinal };
  },

  /**
   * Rejects a workflow item with feedback.
   */
  async rejectStep(
    workflow: ApprovalWorkflow,
    rejectedBy: string,
    reason: string
  ): Promise<ApprovalWorkflow> {
    const updatedWorkflow: ApprovalWorkflow = {
      ...workflow,
      currentStep: 'REJECTED',
      isRejected: true,
      updatedAt: new Date().toISOString(),
    };

    await auditService.logAction({
      action: `WORKFLOW_REJECTED_${workflow.module.toUpperCase()}`,
      entity: 'Workflow',
      description: `Rejected workflow for document ${workflow.documentNumber}. Reason: ${reason}`,
      metadata: { rejectedBy, reason }
    });

    await notificationService.sendNotification({
      recipientId: 1,
      title: `Workflow Rejected: ${workflow.documentNumber}`,
      body: `Transaction ${workflow.documentNumber} was rejected by ${rejectedBy}. Reason: ${reason}`,
      channel: NotificationChannelEnum.Dashboard,
      priority: NotificationPriorityEnum.High
    });

    return updatedWorkflow;
  }
};
