import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation, LANGUAGES } from '../../contexts/I18nContext';

export default function LanguageSwitcher({ variant = 'pill', className = '' }) {
  const { language, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        data-testid="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
        className={`inline-flex items-center space-x-1.5 border border-bd bg-s2 hover:border-ac text-t text-[13px] font-sans font-medium transition-colors cursor-pointer select-none ${
          variant === 'compact'
            ? 'px-2.5 py-1.5 rounded-pill'
            : 'px-3 py-1.5 rounded-pill'
        }`}
      >
        <Globe className="h-3.5 w-3.5 text-ac shrink-0" />
        <span className="font-sans font-medium">{activeLang.nativeLabel}</span>
        <ChevronDown className={`h-3 w-3 text-t2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          data-testid="language-dropdown-menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 rounded-card bg-s border border-bd shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-mono text-t2 border-b border-bd uppercase tracking-wider mb-1">
            Language / भाषा
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                data-testid={`language-option-${lang.code}`}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-sans text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-ac/10 text-ac font-semibold'
                    : 'text-t hover:bg-s2'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[14px]">{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                  <span className="text-[11px] font-mono text-t2">({lang.code})</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-ac shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

