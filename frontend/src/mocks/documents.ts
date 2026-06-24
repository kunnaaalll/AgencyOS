import { DocumentRecord } from '../features/documents/types';

export const mockDocuments: DocumentRecord[] = [
  {
    id: 'doc-1',
    name: 'Q3 Growth Strategy.pdf',
    originalFilename: 'Q3_Growth_Strategy_v2.pdf',
    mimeType: 'application/pdf',
    size: 2450000,
    bucket: 'docs',
    storageKey: 'doc-1',
    documentType: 'REPORT',
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-06-20T10:00:00Z'
  },
  {
    id: 'doc-2',
    name: 'Acme Master Service Agreement',
    originalFilename: 'Acme_MSA_Signed.pdf',
    mimeType: 'application/pdf',
    size: 1100000,
    bucket: 'docs',
    storageKey: 'doc-2',
    documentType: 'CONTRACT',
    createdAt: '2024-06-15T14:30:00Z',
    updatedAt: '2024-06-15T14:30:00Z'
  },
  {
    id: 'doc-3',
    name: 'Brand Logo Package.zip',
    originalFilename: 'logos.zip',
    mimeType: 'application/zip',
    size: 15400000,
    bucket: 'docs',
    storageKey: 'doc-3',
    documentType: 'BRAND_ASSET',
    createdAt: '2024-06-10T09:15:00Z',
    updatedAt: '2024-06-10T09:15:00Z'
  }
];
