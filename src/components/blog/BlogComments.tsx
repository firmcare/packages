'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, MessageCircle, Send } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

export default function BlogComments({ slug }: { slug: string }) {
  const { data: comments = [], isLoading: loading, mutate } = useSWR<Comment[]>(`/api/blog/${slug}/comments`);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', body: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.body.trim()) {
      setError('Name and comment are required.');
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/blog/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) { setError('Failed to post comment. Please try again.'); return; }
    const newComment = await res.json();
    mutate([...comments, newComment], false); // optimistic update
    setForm({ name: '', body: '' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-8">No comments yet. Be the first to leave one!</p>
      ) : (
        <div className="space-y-6 mb-10">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{c.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                  <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-base font-bold text-gray-900 mb-4">Leave a Comment</h3>
        {success && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-xl mb-4">
            Comment posted successfully!
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mb-4">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Comment *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Share your thoughts…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </section>
  );
}
