import { AuditLog } from '../features/system/types';

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    user_id: 'usr_abc123',
    action: 'UPDATE',
    entity_type: 'Lead',
    entity_id: 'lead-89',
    old_values: { status: 'NEW' },
    new_values: { status: 'QUALIFIED' },
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'log-2',
    user_id: 'usr_xyz789',
    action: 'CREATE',
    entity_type: 'Project',
    entity_id: 'proj-12',
    old_values: null,
    new_values: { name: 'Acme Website Redesign' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'log-3',
    user_id: 'usr_abc123',
    action: 'DELETE',
    entity_type: 'Document',
    entity_id: 'doc-55',
    old_values: { file_name: 'old_contract.pdf' },
    new_values: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];
