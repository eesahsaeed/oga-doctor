import AishaAssistantChat from '../../components/AishaAssistantChat';
import { useLanguage } from '../../context/LanguageContext';

export default function AIConsultationPage() {
  const { tr } = useLanguage();
  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="/image/aisha.png"
            alt={tr('Aisha AI assistant')}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {tr('AI Consultation')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {tr(
                'Chat with Gemini health guidance powered by your backend integration.',
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <AishaAssistantChat />
      </section>
    </div>
  );
}
