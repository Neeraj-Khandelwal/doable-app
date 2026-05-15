export type DeepLinkAction = 'add_task' | 'invite' | 'complete_task';

export interface DeepLinkPayload {
  action: DeepLinkAction;
  text?: string;
  code?: string;
  taskId?: string;
}

export function parseDeepLink(search: string): DeepLinkPayload | null {
  const params = new URLSearchParams(search);
  const action = params.get('action') as DeepLinkAction | null;

  if (!action) return null;

  return {
    action,
    text: params.get('text') ?? undefined,
    code: params.get('code') ?? undefined,
    taskId: params.get('task_id') ?? undefined,
  };
}

// Build a deep link URL for testing or sharing
export function buildDeepLink(payload: DeepLinkPayload): string {
  const params = new URLSearchParams({ action: payload.action });
  if (payload.text) params.set('text', payload.text);
  if (payload.code) params.set('code', payload.code);
  if (payload.taskId) params.set('task_id', payload.taskId);
  return `/voice-capture?${params.toString()}`;
}
