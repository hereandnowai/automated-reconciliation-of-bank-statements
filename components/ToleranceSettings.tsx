
import React from 'react';
import { ToleranceSettingsData } from '../types';

interface ToleranceSettingsProps {
    settings: ToleranceSettingsData;
    onSettingsChange: (settings: ToleranceSettingsData) => void;
}

const ToleranceSettings: React.FC<ToleranceSettingsProps> = ({ settings, onSettingsChange }) => {
    const handleChange = (field: keyof ToleranceSettingsData, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            onSettingsChange({ ...settings, [field]: numValue });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="amountTolerance" className="block text-sm font-medium text-gray-700">
                    Amount Tolerance (±₹)
                </label>
                <input
                    type="number"
                    id="amountTolerance"
                    value={settings.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="e.g., 50"
                />
                <p className="mt-1 text-xs text-gray-500">Max amount difference to consider a match.</p>
            </div>
            <div>
                <label htmlFor="dateTolerance" className="block text-sm font-medium text-gray-700">
                    Date Tolerance (± Days)
                </label>
                <input
                    type="number"
                    id="dateTolerance"
                    value={settings.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="e.g., 1"
                />
                 <p className="mt-1 text-xs text-gray-500">Max day difference for matching dates.</p>
            </div>
            <div>
                <label htmlFor="fuzzyMatch" className="block text-sm font-medium text-gray-700">
                   Desc/Vendor Fuzzy Match (%)
                </label>
                <input
                    type="range"
                    id="fuzzyMatch"
                    min="70"
                    max="100"
                    value={settings.fuzzyMatch}
                    onChange={(e) => handleChange('fuzzyMatch', e.target.value)}
                    className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                 <p className="mt-1 text-xs text-gray-500">Match threshold: <span className="font-bold">{settings.fuzzyMatch}%</span> (for close name matches)</p>
            </div>
        </div>
    );
};

export default ToleranceSettings;
