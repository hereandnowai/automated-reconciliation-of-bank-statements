import React, { useState } from 'react';
import { BankTransaction, FinancialRecord, GeminiSuggestion } from '../types';
import { brand } from '../branding';

type UnmatchedItem = (BankTransaction | FinancialRecord) & { source: string };

interface UnmatchedTableProps {
    transactions: UnmatchedItem[];
    onSuggestCorrection: (item: UnmatchedItem, type: 'bank' | 'record') => void;
    suggestion: { id: string; data: GeminiSuggestion | null; loading: boolean };
}

const UnmatchedTable: React.FC<UnmatchedTableProps> = ({ transactions, onSuggestCorrection, suggestion }) => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleSuggestionClick = (item: UnmatchedItem) => {
        const type = item.source.toLowerCase().includes('bank') ? 'bank' : 'record';
        onSuggestCorrection(item, type);
        setExpandedRow(item.id);
    };

    if (transactions.length === 0) {
        return (
             <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold text-status-success">Congratulations!</h3>
                <p className="text-gray-600 mt-2">All transactions have been successfully matched.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-3 text-brand-text">Unmatched & Mismatched Transactions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Source</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Description / Vendor</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount (₹)</th>
                            <th scope="col" className="px-6 py-3">Reference / Invoice ID</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(item => (
                            <React.Fragment key={item.id}>
                                <tr className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            item.source.includes('Bank') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {item.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{item.date}</td>
                                    <td className="px-6 py-4">{'description' in item ? item.description : item.vendor}</td>
                                    <td className="px-6 py-4 text-right font-mono">{item.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-mono">{'invoice_id' in item ? item.invoice_id : item.reference_number}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleSuggestionClick(item)}
                                            className="font-medium text-brand-primary hover:underline disabled:text-gray-400"
                                            disabled={suggestion.loading && suggestion.id === item.id}
                                        >
                                            {suggestion.loading && suggestion.id === item.id ? 'Thinking...' : 'Get Suggestion'}
                                        </button>
                                    </td>
                                </tr>
                                {suggestion.id === item.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={6} className="p-4">
                                            {suggestion.loading ? (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    The AI assistant is analyzing the data...
                                                </div>
                                            ) : suggestion.data && (
                                                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 flex items-start space-x-4">
                                                    <img src={brand.chatbot.avatar} alt="Chatbot Avatar" className="w-12 h-12 rounded-full border-2 border-brand-accent"/>
                                                    <div>
                                                        <h4 className="font-bold text-brand-text">AI-Powered Suggestion</h4>
                                                        <p className="text-sm mt-2"><strong className="font-semibold text-gray-700">Analysis:</strong> {suggestion.data.analysis}</p>
                                                        <p className="text-sm mt-1"><strong className="font-semibold text-gray-700">Recommended Action:</strong> {suggestion.data.suggestion}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnmatchedTable;