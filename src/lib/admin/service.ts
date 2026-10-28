import 'server-only';

import { getAdminStore } from '@/lib/content/admin';
import {
  type AdminService,
  createAdminService,
} from '@/lib/content/admin/service';

import { adminHooks } from './hooks';

const holder = globalThis as { __jmAdminService?: AdminService };

export function getAdminService(): AdminService {
  holder.__jmAdminService ??= createAdminService(getAdminStore(), adminHooks);
  return holder.__jmAdminService;
}
