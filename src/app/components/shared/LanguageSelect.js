import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

function ChevronIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export default function LanguageSelect({
  className = '',
  selectClassName = '',
  labelClassName = '',
  showLabel = true,
  selectStyle = undefined,
  variant = 'native',
  buttonClassName = '',
  menuClassName = '',
  itemClassName = '',
  labelMode = 'native',
  iconOnlyOnMobile = false,
  mobileIcon = null,
}) {
  const { language, languages, setLanguage, tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const forcedBlack = '#000000';
  const forcedWhite = '#ffffff';
  const forcedBorder = '#000000';
  const selectedBackground = '#f3f4f6';

  const activeLanguage = useMemo(
    () => languages.find((item) => item.code === language) || languages[0],
    [language, languages],
  );
  const activeLanguageLabel =
    labelMode === 'code'
      ? (activeLanguage?.code || 'en').toUpperCase()
      : activeLanguage?.nativeLabel || activeLanguage?.label || 'English';

  useEffect(() => {
    if (variant !== 'menu' || !open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, variant]);

  if (variant === 'menu') {
    return (
      <div
        ref={menuRef}
        className={[
          'relative inline-flex items-center',
          showLabel ? 'gap-2' : '',
          className,
        ].join(' ')}
      >
        {showLabel && (
          <span
            className={[
              labelClassName || 'text-sm font-medium text-slate-700',
              iconOnlyOnMobile ? 'hidden sm:inline-flex' : '',
            ].join(' ')}
            style={{ color: forcedBlack }}
          >
            {tr('Language')}
          </span>
        )}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={showLabel ? undefined : tr('Language')}
          onClick={() => setOpen((prev) => !prev)}
          className={[
            'inline-flex min-w-[112px] items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:bg-slate-50',
            buttonClassName,
          ].join(' ')}
          style={{
            color: forcedBlack,
            borderColor: forcedBorder,
            backgroundColor: forcedWhite,
            WebkitTextFillColor: forcedBlack,
          }}
        >
          {iconOnlyOnMobile && mobileIcon ? (
            <span className="sm:hidden" style={{ color: forcedBlack }}>
              {mobileIcon}
            </span>
          ) : null}
          <span
            className={iconOnlyOnMobile ? 'hidden sm:inline' : ''}
            style={{ color: forcedBlack }}
          >
            {activeLanguageLabel}
          </span>
          <ChevronIcon
            className={[
              'h-4 w-4 shrink-0 transition-transform',
              open ? 'rotate-180' : 'rotate-0',
            ].join(' ')}
            style={{ color: forcedBlack }}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label={tr('Choose language')}
            className={[
              'absolute right-0 top-[calc(100%+0.5rem)] z-[70] min-w-[160px] overflow-hidden rounded-xl border border-slate-900 bg-white py-1 shadow-lg',
              menuClassName,
            ].join(' ')}
            style={{
              color: forcedBlack,
              borderColor: forcedBorder,
              backgroundColor: forcedWhite,
            }}
          >
            {languages.map((item) => {
              const selected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    void setLanguage(item.code);
                    setOpen(false);
                  }}
                  className={[
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100',
                    selected
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : '',
                    itemClassName,
                  ].join(' ')}
                  style={{
                    color: forcedBlack,
                    backgroundColor: selected
                      ? selectedBackground
                      : forcedWhite,
                    WebkitTextFillColor: forcedBlack,
                  }}
                >
                  <span style={{ color: forcedBlack }}>{item.nativeLabel}</span>
                  {selected ? (
                    <span
                      className="h-2 w-2 rounded-full bg-current"
                      style={{
                        backgroundColor: forcedBlack,
                        color: forcedBlack,
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <label
      className={[
        'flex items-center gap-2 text-sm text-slate-600',
        className,
      ].join(' ')}
    >
      {showLabel && (
        <span
          className={labelClassName || 'font-medium'}
          style={{ color: forcedBlack }}
        >
          {tr('Language')}
        </span>
      )}
      <span className="relative inline-flex items-center">
        <select
          aria-label={showLabel ? undefined : tr('Language')}
          value={language}
          onChange={(event) => {
            void setLanguage(event.target.value);
          }}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: 'none',
            color: forcedBlack,
            borderColor: forcedBorder,
            backgroundColor: forcedWhite,
            WebkitTextFillColor: forcedBlack,
            ...selectStyle,
          }}
          className={[
            'min-w-[108px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-700 outline-none focus:border-blue-500',
            selectClassName,
          ].join(' ')}
        >
          {languages.map((item) => (
            <option
              key={item.code}
              value={item.code}
              style={{
                color: forcedBlack,
                backgroundColor: forcedWhite,
                WebkitTextFillColor: forcedBlack,
              }}
            >
              {item.nativeLabel}
            </option>
          ))}
        </select>
        <ChevronIcon
          className="pointer-events-none absolute right-3 h-4 w-4 text-slate-700"
          style={{ color: forcedBlack }}
        />
      </span>
    </label>
  );
}
