import { useState } from 'react';
import { Plus, Trash2, BookOpen, Search } from 'lucide-react';
import { formatCitation, generateBibliography } from '../../utils/aiHelpers';
import './ReferenceManager.css';

const ReferenceManager = ({ onInsertCitation }) => {
    const [references, setReferences] = useState([]);
    const [citationFormat, setCitationFormat] = useState('apa');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newReference, setNewReference] = useState({
        type: 'book',
        author: '',
        title: '',
        year: '',
        publisher: '',
        journal: '',
        volume: '',
        issue: '',
        pages: '',
        url: ''
    });
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddReference = () => {
        if (!newReference.author || !newReference.title || !newReference.year) {
            alert('Please fill in author, title, and year');
            return;
        }

        setReferences(prev => [...prev, { ...newReference, id: Date.now() }]);
        setNewReference({
            type: 'book',
            author: '',
            title: '',
            year: '',
            publisher: '',
            journal: '',
            volume: '',
            issue: '',
            pages: '',
            url: ''
        });
        setShowAddForm(false);
    };

    const handleDeleteReference = (id) => {
        setReferences(prev => prev.filter(ref => ref.id !== id));
    };

    const handleInsertCitation = (reference) => {
        const citation = formatCitation(reference, citationFormat);
        onInsertCitation(`(${reference.author.split(',')[0]}, ${reference.year})`);
    };

    const handleGenerateBibliography = () => {
        if (references.length === 0) {
            alert('Add some references first');
            return;
        }
        const bibliography = generateBibliography(references, citationFormat);
        onInsertCitation(bibliography);
    };

    const filteredReferences = references.filter(ref =>
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="reference-manager">
            <div className="reference-header">
                <h3>Reference Library</h3>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus size={16} />
                    Add Reference
                </button>
            </div>

            <div className="citation-format-selector">
                <label htmlFor="format">Citation Format:</label>
                <select
                    id="format"
                    value={citationFormat}
                    onChange={(e) => setCitationFormat(e.target.value)}
                >
                    <option value="apa">APA</option>
                    <option value="mla">MLA</option>
                    <option value="chicago">Chicago</option>
                    <option value="ieee">IEEE</option>
                </select>
            </div>

            {showAddForm && (
                <div className="add-reference-form card">
                    <h4>Add New Reference</h4>

                    <div className="form-group">
                        <label>Type</label>
                        <select
                            value={newReference.type}
                            onChange={(e) => setNewReference(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="book">Book</option>
                            <option value="article">Article</option>
                            <option value="website">Website</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Author(s) *</label>
                        <input
                            type="text"
                            value={newReference.author}
                            onChange={(e) => setNewReference(prev => ({ ...prev, author: e.target.value }))}
                            placeholder="Last, F. M."
                        />
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={newReference.title}
                            onChange={(e) => setNewReference(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter title"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Year *</label>
                            <input
                                type="text"
                                value={newReference.year}
                                onChange={(e) => setNewReference(prev => ({ ...prev, year: e.target.value }))}
                                placeholder="2024"
                            />
                        </div>

                        {newReference.type === 'book' && (
                            <div className="form-group">
                                <label>Publisher</label>
                                <input
                                    type="text"
                                    value={newReference.publisher}
                                    onChange={(e) => setNewReference(prev => ({ ...prev, publisher: e.target.value }))}
                                    placeholder="Publisher name"
                                />
                            </div>
                        )}

                        {newReference.type === 'article' && (
                            <>
                                <div className="form-group">
                                    <label>Journal</label>
                                    <input
                                        type="text"
                                        value={newReference.journal}
                                        onChange={(e) => setNewReference(prev => ({ ...prev, journal: e.target.value }))}
                                        placeholder="Journal name"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {newReference.type === 'article' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Volume</label>
                                <input
                                    type="text"
                                    value={newReference.volume}
                                    onChange={(e) => setNewReference(prev => ({ ...prev, volume: e.target.value }))}
                                    placeholder="Vol."
                                />
                            </div>
                            <div className="form-group">
                                <label>Issue</label>
                                <input
                                    type="text"
                                    value={newReference.issue}
                                    onChange={(e) => setNewReference(prev => ({ ...prev, issue: e.target.value }))}
                                    placeholder="No."
                                />
                            </div>
                            <div className="form-group">
                                <label>Pages</label>
                                <input
                                    type="text"
                                    value={newReference.pages}
                                    onChange={(e) => setNewReference(prev => ({ ...prev, pages: e.target.value }))}
                                    placeholder="pp."
                                />
                            </div>
                        </div>
                    )}

                    {newReference.type === 'website' && (
                        <div className="form-group">
                            <label>URL</label>
                            <input
                                type="url"
                                value={newReference.url}
                                onChange={(e) => setNewReference(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://"
                            />
                        </div>
                    )}

                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleAddReference}>
                            Add Reference
                        </button>
                    </div>
                </div>
            )}

            {references.length > 0 && (
                <>
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search references..."
                        />
                    </div>

                    <div className="references-list">
                        {filteredReferences.map(ref => (
                            <div key={ref.id} className="reference-item card">
                                <div className="reference-content">
                                    <div className="reference-type badge">{ref.type}</div>
                                    <p className="reference-citation">
                                        {formatCitation(ref, citationFormat)}
                                    </p>
                                </div>
                                <div className="reference-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleInsertCitation(ref)}
                                        title="Insert citation"
                                    >
                                        <BookOpen size={16} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleDeleteReference(ref.id)}
                                        title="Delete reference"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn btn-secondary generate-bibliography-btn"
                        onClick={handleGenerateBibliography}
                    >
                        Generate Bibliography
                    </button>
                </>
            )}

            {references.length === 0 && !showAddForm && (
                <div className="empty-state">
                    <BookOpen size={48} className="empty-icon" />
                    <p>No references yet</p>
                    <p className="empty-subtitle">Add references to cite them in your document</p>
                </div>
            )}
        </div>
    );
};

export default ReferenceManager;
