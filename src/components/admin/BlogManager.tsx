'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, ExternalLink, Upload, ImageIcon, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import TipTapEditor from '@/components/ui/TipTapEditor';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string | null; email: string } | null;
  _count: { comments: number };
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  isPublished: boolean;
}

const empty: FormState = { title: '', slug: '', excerpt: '', coverImage: '', content: '', isPublished: false };

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function BlogManager() {
  const toast = useToast();
  const { data: posts = [], isLoading: loading, mutate: mutatePosts } = useSWR<BlogPost[]>('/api/admin/blog');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<{ id: string; title: string } | null>(null);
  const [comments, setComments] = useState<{ id: string; name: string; body: string; createdAt: string }[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openComments = async (post: BlogPost) => {
    setCommentPost({ id: post.id, title: post.title });
    setCommentsLoading(true);
    const res = await fetch(`/api/admin/blog/${post.id}/comments`);
    if (res.ok) setComments(await res.json());
    setCommentsLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/admin/blog/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment removed.');
    } else {
      toast.error('Failed to remove comment.');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sigRes = await fetch('/api/upload/signature', { method: 'POST' });
      if (!sigRes.ok) throw new Error('Failed to get upload signature');
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', String(timestamp));
      fd.append('signature', signature);
      fd.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
      );
      if (!uploadRes.ok) throw new Error('Upload failed');
      const data = await uploadRes.json();
      setForm((f) => ({ ...f, coverImage: data.secure_url }));
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true); };

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/admin/blog/${id}`);
    if (!res.ok) return;
    const post = await res.json();
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      coverImage: post.coverImage ?? '',
      content: post.content,
      isPublished: post.isPublished,
    });
    setEditId(id);
    setShowForm(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: editId ? f.slug : slugify(title) }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    setSaving(true);
    const url = editId ? `/api/admin/blog/${editId}` : '/api/admin/blog';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Failed to save post. Please try again.');
      return;
    }
    toast.success(editId ? 'Post updated successfully.' : 'Post published successfully.');
    setShowForm(false);
    await mutatePosts();
  };

  const handleTogglePublish = async (post: BlogPost) => {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });
    await mutatePosts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/blog/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    if (res.ok) toast.success('Post deleted.');
    else toast.error('Failed to delete post.');
    await mutatePosts();
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No blog posts yet</p>
          <p className="text-sm">Click &quot;New Post&quot; to write your first article.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Author</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 truncate max-w-xs">{post.title}</p>
                      <p className="text-xs text-gray-400 truncate">/blog/{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-600">{post.author?.name ?? '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500">
                      {post.publishedAt ? fmt(post.publishedAt) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {post.isPublished && (
                          <Link href={`/blog/${post.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-purple-50 transition-colors" title="View on site">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-1.5 rounded-lg transition-colors ${post.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={post.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {post.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openComments(post)} className="relative p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors" title="Comments">
                          <MessageCircle className="w-4 h-4" />
                          {post._count.comments > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                              {post._count.comments > 99 ? '99+' : post._count.comments}
                            </span>
                          )}
                        </button>
                        <button onClick={() => openEdit(post.id)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-purple-50 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(post.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl animate-slideInRight overflow-y-auto">
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">/blog/</span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="auto-generated"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="Short summary shown on the blog listing…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cover Image</label>

                {form.coverImage ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 mb-2">
                    <Image src={form.coverImage} alt="Cover preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-44 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mb-2">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">No image selected</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading…' : form.coverImage ? 'Replace Image' : 'Upload Image'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content *</label>
                <TipTapEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  placeholder="Write your blog post here…"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {form.isPublished ? 'Published — visible on site' : 'Draft — not visible on site'}
                </span>
              </label>
            </div>

            {/* Form footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Publish Post'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments panel */}
      {commentPost && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Comments</h2>
                <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{commentPost.title}</p>
              </div>
              <button onClick={() => setCommentPost(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {commentsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No comments on this post yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-xs">{c.name[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete post?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The post will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
