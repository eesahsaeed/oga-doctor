import AlexAssistantChat from '../../components/AlexAssistantChat';

export default function AIConsultationPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">AI Consultation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chat with Gemini health guidance powered by your backend integration.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <AlexAssistantChat />
      </section>
    </div>
  );
}
