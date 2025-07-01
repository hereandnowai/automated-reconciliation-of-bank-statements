import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';

interface FileUploadProps {
    label: string;
    onFileChange: (file: File) => void;
    fileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileChange, fileName }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
        }
    };

    return (
        <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
            <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex justify-center w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200
                ${isDragging ? 'border-brand-primary bg-teal-50' : 'border-gray-300 hover:border-brand-accent'}
                ${fileName ? 'bg-green-50 border-status-success' : 'bg-white'}`}
            >
                {fileName ? (
                    <div className="text-center text-status-success">
                        <FileIcon className="mx-auto h-12 w-12" />
                        <p className="mt-1 text-sm font-semibold">{fileName}</p>
                        <p className="text-xs text-gray-500">Click or drag to replace</p>
                    </div>
                ) : (
                    <div className="space-y-1 text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        <div className="flex text-sm text-gray-600">
                            <span className="relative font-medium text-brand-primary">
                                Click to upload
                            </span>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV up to 10MB</p>
                    </div>
                )}
                <input
                    type="file"
                    className="sr-only"
                    accept=".csv"
                    onChange={handleFileSelect}
                />
            </label>
        </div>
    );
};

export default FileUpload;