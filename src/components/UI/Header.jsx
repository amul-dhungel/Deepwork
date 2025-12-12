import { Moon, Sun, FileDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    const handleExport = () => {
        window.print();
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="logo">
                    <div className="logo-icon">
                        <span>AI</span>
                    </div>
                    <h1 className="logo-text">WordAssist</h1>
                </div>
            </div>

            <div className="header-right">
                <button
                    className="btn-secondary"
                    onClick={handleExport}
                    title="Export as PDF"
                >
                    <FileDown size={16} />
                    Export
                </button>

                <div className="divider-vertical"></div>

                <button
                    className="btn-icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
};

export default Header;
