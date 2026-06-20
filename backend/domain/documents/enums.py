from enum import Enum


class DocumentType(str, Enum):
    CONTRACT = "CONTRACT"
    REPORT = "REPORT"
    BRAND_ASSET = "BRAND_ASSET"
    CREATIVE = "CREATIVE"
    INVOICE = "INVOICE"
    GENERAL = "GENERAL"
