import MarketingPageLayout from '../../components/marketing/MarketingPageLayout';
import { Link } from 'react-router-dom';

const posts = [
  {
    title: 'Managing Stress in Busy Lagos Life',
    excerpt:
      'Practical routines and recovery habits for better mental resilience.',
    tag: 'Mental Health',
  },
  {
    title: 'Why Blood Pressure Tracking Matters After 40',
    excerpt: 'Key signals to monitor and when to escalate to a clinician.',
    tag: 'Cardiology',
  },
  {
    title: 'How to Prepare for a Video Consultation',
    excerpt: 'Simple checklist to get faster, better care outcomes online.',
    tag: 'Consultation',
  },
];

export default function BlogPage() {
  return (
    <MarketingPageLayout
      title="Blog"
      subtitle="Health insights and practical guidance from the OgaDoctor care team."
    >
      <div className="space-y-3">
        {posts.map((post) => (
          <article
            key={post.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {post.tag}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            <Link
              to="/auth/signin"
              className="inline-flex mt-3 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Read Article
            </Link>
          </article>
        ))}
      </div>
    </MarketingPageLayout>
  );
}
