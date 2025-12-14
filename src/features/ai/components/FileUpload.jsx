import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onUploadComplete }) => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
        setUploadStatus(null);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const result = await response.json();
            setUploadStatus('success');
            if (onUploadComplete) onUploadComplete(result);

            // Clear files after successful upload (optional)
            // setFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="file-upload-container">
            <h3>Context Documents</h3>
            <p className="upload-subtitle">Upload PDFs or Images for AI context</p>

            <div
                className="drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <Upload size={24} className="upload-icon" />
                <p>Click or drag files here</p>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden-input"
                    accept=".pdf,.docx,.txt,.jpg,.png,.jpeg"
                />
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            {file.type.includes('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                            <span className="file-name">{file.name}</span>
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {files.length > 0 && (
                <button
                    className={`upload-btn ${isUploading ? 'loading' : ''} ${uploadStatus === 'success' ? 'success' : ''}`}
                    onClick={uploadFiles}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing...
                        </>
                    ) : uploadStatus === 'success' ? (
                        <>
                            <CheckCircle size={18} />
                            Uploaded!
                        </>
                    ) : (
                        'Upload & Analyze'
                    )}
                </button>
            )}
        </div>
    );
};

export default FileUpload;
