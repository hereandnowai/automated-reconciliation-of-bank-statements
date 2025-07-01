
import { BankTransaction, FinancialRecord, ReconciliationResult, ToleranceSettingsData } from '../types';

// Simple CSV parser
export const parseCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }
                const header = lines[0].split(',').map(h => h.trim());
                const data = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    return header.reduce((obj, nextKey, index) => {
                        obj[nextKey] = values[index];
                        return obj;
                    }, {} as { [key: string]: string });
                });
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

// Levenshtein distance for fuzzy string matching
const levenshteinDistance = (a: string, b: string): number => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1).fill(null).map(() => Array(an + 1).fill(null));
    for (let i = 0; i <= an; i += 1) { matrix[0][i] = i; }
    for (let j = 0; j <= bn; j += 1) { matrix[j][0] = j; }
    for (let j = 1; j <= bn; j += 1) {
        for (let i = 1; i <= an; i += 1) {
            const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + substitutionCost,
            );
        }
    }
    return matrix[bn][an];
};

const similarity = (a: string, b: string): number => {
    const longer = Math.max(a.length, b.length);
    if (longer === 0) return 1.0;
    return (longer - levenshteinDistance(a.toLowerCase(), b.toLowerCase())) / longer;
};


export const reconcile = (
    bankData: BankTransaction[],
    recordData: FinancialRecord[],
    tolerances: ToleranceSettingsData
): ReconciliationResult => {
    const result: ReconciliationResult = {
        matched: [],
        mismatchedAmount: [],
        missingInRecords: [],
        missingInBank: [],
    };

    const bankDataCopy = [...bankData];
    let recordDataCopy = [...recordData];
    
    // Pass 1: Exact reference_number match
    for (let i = bankDataCopy.length - 1; i >= 0; i--) {
        const bankTx = bankDataCopy[i];
        const matchIndex = recordDataCopy.findIndex(rec => rec.reference_number === bankTx.reference_number);
        
        if (matchIndex !== -1) {
            const recordTx = recordDataCopy[matchIndex];
            if (Math.abs(bankTx.amount - recordTx.amount) <= tolerances.amount) {
                 result.matched.push({ bankTransaction: bankTx, financialRecord: recordTx });
            } else {
                 result.mismatchedAmount.push({ bankTransaction: bankTx, financialRecord: recordTx, amountDifference: bankTx.amount - recordTx.amount });
            }
            bankDataCopy.splice(i, 1);
            recordDataCopy.splice(matchIndex, 1);
        }
    }

    // Pass 2: Fuzzy matching for remaining transactions
    for (let i = bankDataCopy.length - 1; i >= 0; i--) {
        const bankTx = bankDataCopy[i];
        let bestMatch: { record: FinancialRecord; index: number; score: number } | null = null;

        for (let j = 0; j < recordDataCopy.length; j++) {
            const recordTx = recordDataCopy[j];
            const dateDiff = Math.abs(new Date(bankTx.date).getTime() - new Date(recordTx.date).getTime()) / (1000 * 3600 * 24);
            const descSim = similarity(bankTx.description, recordTx.vendor);

            if (dateDiff <= tolerances.date && descSim >= tolerances.fuzzyMatch / 100) {
                 const currentScore = (descSim * 0.7) + ((tolerances.date - dateDiff) / tolerances.date * 0.3); // Weighted score
                 if (!bestMatch || currentScore > bestMatch.score) {
                    bestMatch = { record: recordTx, index: j, score: currentScore };
                 }
            }
        }
        
        if (bestMatch) {
            if (Math.abs(bankTx.amount - bestMatch.record.amount) <= tolerances.amount) {
                result.matched.push({ bankTransaction: bankTx, financialRecord: bestMatch.record });
            } else {
                result.mismatchedAmount.push({ bankTransaction: bankTx, financialRecord: bestMatch.record, amountDifference: bankTx.amount - bestMatch.record.amount });
            }
            bankDataCopy.splice(i, 1);
            recordDataCopy.splice(bestMatch.index, 1);
        }
    }

    result.missingInRecords = bankDataCopy;
    result.missingInBank = recordDataCopy;
    
    return result;
};


export const downloadUnmatchedCsv = (unmatched: any[]) => {
    if (unmatched.length === 0) return;

    const headers = ['source', 'date', 'description_or_vendor', 'amount', 'reference_or_invoice_id'];
    const csvRows = [headers.join(',')];

    for (const item of unmatched) {
        const row = [
            item.source,
            item.date,
            `"${'description' in item ? item.description : item.vendor}"`,
            item.amount,
            `"${'invoice_id' in item ? item.invoice_id : item.reference_number}"`
        ];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'unmatched_transactions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
