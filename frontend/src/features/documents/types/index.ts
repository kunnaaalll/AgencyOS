export type DocumentType = 'CONTRACT' | 'REPORT' | 'BRAND_ASSET' | 'CREATIVE' | 'INVOICE' | 'GENERAL';

export interface DocumentRecord {
  id: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  bucket: string;
  storageKey: string;
  documentType: DocumentType;
  clientId?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialRecord {
  id: string;
  provider: string;
  clientId?: string;
  accountEmail?: string;
  notes?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}
