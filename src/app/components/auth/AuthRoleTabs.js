import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getAuthRoute, normalizeAccountType } from '../../lib/account';

export default function AuthRoleTabs({
  accountType = 'patient',
  mode = 'signin',
}) {
  const { tr } = useLanguage();
  const activeAccountType = normalizeAccountType(accountType, 'patient');

  const options = [
    { value: 'patient', label: tr('Patient') },
    { value: 'doctor', label: tr('Doctor') },
  ];

  return (
    <div className="mb-4 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => {
        const isActive = option.value === activeAccountType;

        return (
          <Link
            key={option.value}
            to={getAuthRoute(option.value, mode)}
            className={[
              'flex-1 rounded-2xl px-4 py-2 text-center text-sm font-semibold transition-colors',
              isActive
                ? 'bg-white text-slate-900 ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
