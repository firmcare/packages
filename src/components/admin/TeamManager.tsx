'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, Loader2, X, Upload, UserCircle2, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string | null;
  image: string | null;
  order: number;
}

interface FormState {
  name: string;
  position: string;
  email: string;
  image: string;
  order: number;
}

const empty: FormState = { name: '', position: '', email: '', image: '', order: 0 };
const API = '/api/admin/team';

export default function TeamManager() {
  const toast = useToast();
  const { data: members = [], isLoading: loading, mutate } = useSWR<TeamMember[]>(API);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setForm({ ...empty, order: members.length });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (m: TeamMember) => {
    setForm({ name: m.name, position: m.position, email: m.email ?? '', image: m.image ?? '', order: m.order });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const data = await uploadRes.json();
      setForm((f) => ({ ...f, image: data.secure_url }));
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      toast.error('Name and position are required.');
      return;
    }
    setSaving(true);
    const url = editId ? `/api/admin/team/${editId}` : API;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Failed to save. Please try again.'); return; }
    toast.success(editId ? 'Member updated.' : 'Member added.');
    setShowForm(false);
    mutate();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`${API}/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    if (res.ok) { toast.success('Member removed.'); mutate(); }
    else toast.error('Failed to remove member.');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Team</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <UserCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm mt-1">Click &quot;Add Member&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary/10 shrink-0 flex items-center justify-center">
                {m.image ? (
                  <Image src={m.image} alt={m.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <UserCircle2 className="w-8 h-8 text-primary/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                <p className="text-sm text-primary truncate">{m.position}</p>
                {m.email && <p className="text-xs text-gray-400 truncate mt-0.5">{m.email}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => openEdit(m)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary font-medium transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => setDeleteId(m.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0 mt-1" aria-label={`Order: ${m.order}`} />
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-bold text-gray-900">{editId ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Photo</label>
                {form.image ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 mb-2">
                    <Image src={form.image} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center mb-2">
                    <UserCircle2 className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="team-photo-upload" />
                <label
                  htmlFor="team-photo-upload"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-xl cursor-pointer text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : form.image ? 'Replace Photo' : 'Upload Photo'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Doe" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Position / Title *</label>
                <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="Chief Medical Officer" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@firmcare.com.ng" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Order</label>
                <input type="number" min={0} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} className="w-24 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button onClick={handleSave} disabled={saving || uploading} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Member'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove member?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove the team member from the site.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors">Remove</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
