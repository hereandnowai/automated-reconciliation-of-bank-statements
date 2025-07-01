
export interface BankTransaction {
    date: string;
    description: string;
    amount: number;
    reference_number: string;
    status?: 'matched' | 'mismatched' | 'unmatched';
    id: string;
}

export interface FinancialRecord {
    date: string;
    vendor: string;
    amount: number;
    invoice_id: string;
    reference_number: string;
    status?: 'matched' | 'mismatched' | 'unmatched';
    id: string;
}

export interface MatchedPair {
    bankTransaction: BankTransaction;
    financialRecord: FinancialRecord;
}

export interface MismatchedPair {
    bankTransaction: BankTransaction;
    financialRecord: FinancialRecord;
    amountDifference: number;
}

export interface ReconciliationResult {
    matched: MatchedPair[];
    mismatchedAmount: MismatchedPair[];
    missingInRecords: BankTransaction[]; // Unmatched bank transactions
    missingInBank: FinancialRecord[]; // Unmatched financial records
}

export interface ToleranceSettingsData {
    amount: number;
    date: number;
    fuzzyMatch: number;
}

export interface GeminiSuggestion {
    analysis: string;
    suggestion: string;
}
