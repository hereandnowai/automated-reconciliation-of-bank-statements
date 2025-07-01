import React, { useState, useCallback, useMemo } from 'react';
import { BankTransaction, FinancialRecord, ReconciliationResult, ToleranceSettingsData, GeminiSuggestion } from './types';
import { parseCsv, reconcile, downloadUnmatchedCsv } from './services/reconciliationService';
import { getCorrectionSuggestion } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ToleranceSettings from './components/ToleranceSettings';
import Dashboard from './components/Dashboard';
import UnmatchedTable from './components/UnmatchedTable';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { brand } from './branding';
import Footer from './components/Footer';

const App: React.FC = () => {
    const [bankFile, setBankFile] = useState<File | null>(null);
    const [recordFile, setRecordFile] = useState<File | null>(null);
    const [bankData, setBankData] = useState<BankTransaction[]>([]);
    const [recordData, setRecordData] = useState<FinancialRecord[]>([]);
    const [tolerances, setTolerances] = useState<ToleranceSettingsData>({ amount: 50, date: 1, fuzzyMatch: 90 });
    const [result, setResult] = useState<ReconciliationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<{ id: string; data: GeminiSuggestion | null; loading: boolean }>({ id: '', data: null, loading: false });

    const handleFileChange = async (file: File, type: 'bank' | 'record') => {
        try {
            setError(null);
            setResult(null);
            const parsedData = await parseCsv(file);
            if (type === 'bank') {
                setBankFile(file);
                setBankData(parsedData.map((row, i) => ({ ...row, amount: parseFloat(row.amount), id: `bank-${i}` })));
            } else {
                setRecordFile(file);
                setRecordData(parsedData.map((row, i) => ({ ...row, amount: parseFloat(row.amount), id: `record-${i}` })));
            }
        } catch (err) {
            setError(`Error parsing ${file.name}. Please ensure it's a valid CSV with correct headers.`);
            console.error(err);
        }
    };

    const handleReconcile = useCallback(() => {
        if (!bankData.length || !recordData.length) {
            setError("Please upload both bank statement and financial records CSV files.");
            return;
        }
        setIsLoading(true);
        setError(null);
        // Simulate processing time for better UX
        setTimeout(() => {
            try {
                const reconciliationResult = reconcile(bankData, recordData, tolerances);
                setResult(reconciliationResult);
            } catch (err) {
                setError("An error occurred during reconciliation.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [bankData, recordData, tolerances]);

    const handleSuggestCorrection = useCallback(async (item: BankTransaction | FinancialRecord, type: 'bank' | 'record') => {
        setSuggestion({ id: item.id, data: null, loading: true });
        const potentialMatches = type === 'bank' ? recordData : bankData;
        try {
            const geminiResult = await getCorrectionSuggestion(item, potentialMatches, type);
            setSuggestion({ id: item.id, data: geminiResult, loading: false });
        } catch (err) {
            console.error("Error getting suggestion:", err);
            const suggestionError: GeminiSuggestion = {
                analysis: 'Error fetching suggestion.',
                suggestion: 'Could not connect to the AI assistant. Please check your API key and network connection.'
            };
            setSuggestion({ id: item.id, data: suggestionError, loading: false });
        }
    }, [bankData, recordData]);

    const unmatchedTransactions = useMemo(() => {
        if (!result) return [];
        return [
            ...result.missingInRecords.map(item => ({ ...item, source: 'Bank Statement' })),
            ...result.missingInBank.map(item => ({ ...item, source: 'Financial Records' })),
            ...result.mismatchedAmount.map(pair => ({ ...pair.bankTransaction, source: 'Mismatch (Bank)' })),
            ...result.mismatchedAmount.map(pair => ({ ...pair.financialRecord, source: 'Mismatch (Record)' })),
        ];
    }, [result]);

    return (
        <div className="min-h-screen bg-neutral-light text-brand-text flex flex-col">
            <div className="flex-grow max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
                <header className="mb-8 text-center">
                    <img src={brand.logo.title} alt={`${brand.organizationShortName} Logo`} className="h-20 mx-auto mb-2"/>
                    <p className="text-lg text-brand-subtext italic">{brand.slogan}</p>
                </header>

                {error && (
                    <div className="bg-red-100 border-l-4 border-status-danger text-red-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                           <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-brand-text">1. Upload Files</h2>
                           <div className="space-y-4">
                              <FileUpload label="Bank Statement CSV" onFileChange={(file) => handleFileChange(file, 'bank')} fileName={bankFile?.name} />
                              <FileUpload label="Financial Records CSV" onFileChange={(file) => handleFileChange(file, 'record')} fileName={recordFile?.name} />
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-brand-text">2. Configure Tolerance</h2>
                          <ToleranceSettings settings={tolerances} onSettingsChange={setTolerances} />
                        </div>
                        
                        <button
                            onClick={handleReconcile}
                            disabled={!bankFile || !recordFile || isLoading}
                            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Reconciling...
                                </>
                            ) : "3. Run Reconciliation"}
                        </button>
                    </div>

                    <div className="lg:col-span-2">
                        {result ? (
                            <div className="space-y-8">
                                <Dashboard result={result} onDownload={() => downloadUnmatchedCsv(unmatchedTransactions)}/>
                                <UnmatchedTable
                                    transactions={unmatchedTransactions}
                                    onSuggestCorrection={handleSuggestCorrection}
                                    suggestion={suggestion}
                                />
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
                               {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-12 w-12 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <h3 className="text-xl font-semibold text-brand-text">Running Reconciliation...</h3>
                                        <p className="text-brand-subtext mt-1">Analyzing your financial data. Please wait.</p>
                                    </>
                               ) : (
                                  <>
                                    <CheckCircleIcon className="w-16 h-16 text-gray-300 mb-4"/>
                                    <h3 className="text-2xl font-semibold text-gray-500">Awaiting Reconciliation</h3>
                                    <p className="text-brand-subtext mt-2 max-w-md">
                                        Upload your files, configure tolerances, and click "Run Reconciliation" to see your results here.
                                    </p>
                                  </>
                               )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default App;