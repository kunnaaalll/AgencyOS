import { AuditLog } from '../features/system/types';

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    user_id: 'usr_abc123',
    action: 'UPDATE',
    entity_type: 'Lead',
    entity_id: 'lead-89',
    details: { old_status: 'NEW', new_status: 'QUALIFIED' },
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    ip_address: '192.168.1.1'
  },
  {
    id: 'log-2',
    user_id: 'usr_xyz789',
    action: 'CREATE',
    entity_type: 'Project',
    entity_id: 'proj-12',
    details: { name: 'Acme Website Redesign' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    ip_address: '192.168.1.4'
  },
  {
    id: 'log-3',
    user_id: 'usr_abc123',
    action: 'DELETE',
    entity_type: 'Document',
    entity_id: 'doc-55',
    details: { file_name: 'old_contract.pdf' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    ip_address: '192.168.1.1'
  }
];
