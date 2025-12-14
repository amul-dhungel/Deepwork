
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './DropDown.css';

export default function DropDown({ label, icon, children, active }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropRef.current && !dropRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="toolbar-dropdown" ref={dropRef}>
            <button
                className={`dropdown-button ${active ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                {icon && <span className="icon">{icon}</span>}
                <span className="text">{label}</span>
                <ChevronDown size={14} />
            </button>
            {isOpen && (
                <div className="dropdown-menu" onClick={() => setIsOpen(false)}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropDownItem({ children, onClick, active, className, style }) {
    return (
        <button
            type="button"
            className={`dropdown-item ${active ? 'active' : ''} ${className || ''}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </button>
    );
}
