import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReconciliationResult } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface DashboardProps {
    result: ReconciliationResult;
    onDownload: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center">
        <div className="p-3 rounded-full bg-teal-50 text-brand-primary mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-text">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ result, onDownload }) => {
    const totalBankTransactions = result.matched.length + result.mismatchedAmount.length + result.missingInRecords.length;
    const totalRecordTransactions = result.matched.length + result.mismatchedAmount.length + result.missingInBank.length;

    const matchedCount = result.matched.length;
    const matchedPercentage = totalBankTransactions > 0 ? ((matchedCount / totalBankTransactions) * 100).toFixed(1) : "0.0";
    
    const unmatchedCount = result.missingInBank.length + result.missingInRecords.length + result.mismatchedAmount.length;

    const pieData = [
        { name: 'Matched', value: matchedCount, color: '#00875a' },
        { name: 'Mismatched Amount', value: result.mismatchedAmount.length, color: '#ffab00' },
        { name: 'Missing in Records', value: result.missingInRecords.length, color: '#de350b' },
        { name: 'Missing in Bank', value: result.missingInBank.length, color: '#42526e' },
    ];
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-3 text-brand-text">Reconciliation Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Matched Transactions" value={matchedCount} icon={<CheckCircleIcon className="w-6 h-6"/>} />
                <StatCard title="Unmatched / Mismatched" value={unmatchedCount} icon={<XCircleIcon className="w-6 h-6"/>} />
                <StatCard title="Match Rate" value={`${matchedPercentage}%`} icon={<ExclamationTriangleIcon className="w-6 h-6"/>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                     <h3 className="text-lg font-semibold mb-2 text-brand-text">Status Breakdown</h3>
                    <div className="space-y-2">
                        {pieData.map(entry => (
                            <div key={entry.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                                    <span>{entry.name}</span>
                                </div>
                                <span className="font-bold">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                     <button
                        onClick={onDownload}
                        className="mt-6 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                    >
                        Download Unmatched as CSV
                    </button>
                </div>
                 <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false}>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} transactions`, undefined]}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;