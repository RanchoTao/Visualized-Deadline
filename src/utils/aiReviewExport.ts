import type { Task } from '../types/task';
import { getActivityTypeLabel, getLifecycleStatusLabel } from './taskScoring';

export const AI_REVIEW_EXPORT_SCHEMA_VERSION = '0.1';

export interface AIReviewLogEntry {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  activityType: string;
  activityTypeLabel: string;
  timestamp: string;
  importance: number;
  progress: number;
  deadline?: string;
  description?: string;
  reviewNote?: string;
}

export interface AIReviewExportEnvelope {
  schemaVersion: typeof AI_REVIEW_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  app: 'Visualized-Deadline';
  exportType: 'ai_review_context';
  data: {
    source: 'activity_log';
    summary: {
      totalLogs: number;
      completed: number;
      abandoned: number;
      withReviewNotes: number;
    };
    logs: AIReviewLogEntry[];
    futureUse: {
      purpose: string;
      privacy: string;
    };
  };
}

function archiveTimestamp(task: Task): string {
  return task.completedAt ?? task.abandonedAt ?? task.updatedAt;
}

export function getArchivedTasksForReview(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.lifecycleStatus === 'completed' || task.lifecycleStatus === 'abandoned')
    .sort((a, b) => new Date(archiveTimestamp(b)).getTime() - new Date(archiveTimestamp(a)).getTime());
}

export function createAIReviewExport(tasks: Task[], exportedAt = new Date().toISOString()): AIReviewExportEnvelope {
  const archivedTasks = getArchivedTasksForReview(tasks);
  const logs = archivedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.lifecycleStatus,
    statusLabel: getLifecycleStatusLabel(task.lifecycleStatus),
    activityType: task.activityType,
    activityTypeLabel: getActivityTypeLabel(task.activityType),
    timestamp: archiveTimestamp(task),
    importance: task.importance,
    progress: task.progress,
    deadline: task.deadline,
    description: task.description,
    reviewNote: task.reviewNote,
  }));

  return {
    schemaVersion: AI_REVIEW_EXPORT_SCHEMA_VERSION,
    exportedAt,
    app: 'Visualized-Deadline',
    exportType: 'ai_review_context',
    data: {
      source: 'activity_log',
      summary: {
        totalLogs: logs.length,
        completed: archivedTasks.filter((task) => task.lifecycleStatus === 'completed').length,
        abandoned: archivedTasks.filter((task) => task.lifecycleStatus === 'abandoned').length,
        withReviewNotes: archivedTasks.filter((task) => Boolean(task.reviewNote?.trim())).length,
      },
      logs,
      futureUse: {
        purpose: '作为未来复盘模块或用户主动复制给 AI 工具的结构化上下文；当前应用不会自动上传或调用任何 AI 服务。',
        privacy: '导出文件只在本地浏览器生成，由用户自行保存与使用。',
      },
    },
  };
}

export function formatAIReviewExportFilename(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `VD-review-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}
