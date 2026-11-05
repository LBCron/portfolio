import { type ContentLogger } from '@/lib/content/log';

export interface RecordedWarning {
  details: Record<string, unknown>;
  event: string;
}

export function createRecordingLogger(): {
  warnings: RecordedWarning[];
} & ContentLogger {
  const warnings: RecordedWarning[] = [];

  return {
    warnings,
    warn(event, details): void {
      warnings.push({ event, details });
    },
  };
}
