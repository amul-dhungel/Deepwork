import { useState } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import './ImageUploadModal.css';

export default function ImageUploadModal({ isOpen, onClose, onInsert }) {
    const [activeTab, setActiveTab] = useState('url');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [altText, setAltText] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
        if (url) {
            setPreviewUrl(url);
        }
    };

    const handleInsert = () => {
        if (activeTab === 'url' && imageUrl) {
            onInsert({
                src: imageUrl,
                alt: altText || 'Image',
                maxWidth: 800
            });
            handleClose();
        } else if (activeTab === 'file' && selectedFile) {
            // Upload file to backend
            const formData = new FormData();
            formData.append('image', selectedFile);

            fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    onInsert({
                        src: data.url,
                        alt: altText || selectedFile.name,
                        maxWidth: 800
                    });
                    handleClose();
                })
                .catch(err => {
                    console.error('Upload failed:', err);
                    alert('Image upload failed. Please try again.');
                });
        }
    };

    const handleClose = () => {
        setImageUrl('');
        setSelectedFile(null);
        setPreviewUrl('');
        setAltText('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Insert Image</h2>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab ${activeTab === 'url' ? 'active' : ''}`}
                        onClick={() => setActiveTab('url')}
                    >
                        <LinkIcon size={16} />
                        <span>URL</span>
                    </button>
                    <button
                        className={`tab ${activeTab === 'file' ? 'active' : ''}`}
                        onClick={() => setActiveTab('file')}
                    >
                        <Upload size={16} />
                        <span>Upload File</span>
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'url' ? (
                        <div className="url-tab">
                            <label>Image URL</label>
                            <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={handleUrlChange}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="file-tab">
                            <label htmlFor="file-input" className="file-picker">
                                <Upload size={32} />
                                <p>Click to choose an image</p>
                                <span>or drag and drop</span>
                            </label>
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            {selectedFile && (
                                <p className="file-name">Selected: {selectedFile.name}</p>
                            )}
                        </div>
                    )}

                    {previewUrl && (
                        <div className="preview-section">
                            <label>Preview</label>
                            <img src={previewUrl} alt="Preview" className="preview-image" />
                        </div>
                    )}

                    <div className="alt-text-section">
                        <label>Alt Text (optional)</label>
                        <input
                            type="text"
                            placeholder="Describe the image"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleInsert}
                        disabled={!previewUrl}
                    >
                        Insert Image
                    </button>
                </div>
            </div>
        </div>
    );
}
