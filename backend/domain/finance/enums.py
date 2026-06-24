from enum import Enum


class RevenueStatus(str, Enum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    OVERDUE = "OVERDUE"


class ExpenseStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
