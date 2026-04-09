"use client";

import { useState } from "react";
import useSWR from "swr";
import { MapPin, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";

interface Location {
  id: string;
  name: string;
  price: number | string;
  isActive: boolean;
  createdAt: string;
}

const fmt = (n: number | string) =>
  `NGN ${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

const API = "/api/admin/home-collection-locations";

export default function HomeCollectionLocationsManager() {
  const { data: locations = [], isLoading: loading, error: swrError, mutate } = useSWR<Location[]>(API);
  const error = swrError ? "Could not load locations." : "";

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async () => {
    if (!createName.trim() || !createPrice) return;
    const price = parseFloat(createPrice);
    if (isNaN(price) || price <= 0) { setCreateError("Enter a valid price."); return; }
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/home-collection-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), price }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setCreateName("");
      setCreatePrice("");
      setShowCreate(false);
      await mutate();
    } catch {
      setCreateError("Could not create location.");
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (loc: Location) => {
    setEditId(loc.id);
    setEditName(loc.name);
    setEditPrice(String(Number(loc.price)));
    setEditError("");
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim() || !editPrice) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) { setEditError("Enter a valid price."); return; }
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/home-collection-locations/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), price }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditId(null);
      await mutate();
    } catch {
      setEditError("Could not update location.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleActive = async (loc: Location) => {
    try {
      await fetch(`/api/admin/home-collection-locations/${loc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !loc.isActive }),
      });
      await mutate();
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/home-collection-locations/${id}`, { method: "DELETE" });
      if (res.status === 204) {
        await mutate(locations.filter((l) => l.id !== id), false);
      } else if (res.ok) {
        // Was deactivated (has bookings)
        await mutate();
      }
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Home Collection Locations
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Set the service areas and pricing for home sample collection.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">New Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Location Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Lagos Island"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Price (NGN)</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary bg-white">
                <span className="px-3 py-2 text-sm text-gray-500 font-medium bg-gray-50 border-r border-gray-200 select-none">₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={createPrice ? Number(createPrice).toLocaleString("en-NG") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setCreatePrice(raw);
                  }}
                  placeholder="0"
                  className="flex-1 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>
          {createError && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {createError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createLoading || !createName.trim() || !createPrice}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {createLoading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateName(""); setCreatePrice(""); setCreateError(""); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No locations yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    {editId === loc.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-40"
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{loc.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {editId === loc.id ? (
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary bg-gray-50 w-36">
                        <span className="px-2 py-1 text-sm text-gray-500 font-medium bg-gray-100 border-r border-gray-200 select-none">₦</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editPrice ? Number(editPrice).toLocaleString("en-NG") : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            setEditPrice(raw);
                          }}
                          className="flex-1 bg-transparent px-2 py-1 text-sm outline-none w-0"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-700 font-semibold">{fmt(loc.price)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(loc)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        loc.isActive
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {loc.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {loc.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    {editId === loc.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        {editError && <span className="text-red-500 text-xs">{editError}</span>}
                        <button
                          onClick={handleUpdate}
                          disabled={editLoading}
                          className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> {editLoading ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => startEdit(loc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteId === loc.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600">Delete?</span>
                            <button
                              onClick={() => handleDelete(loc.id)}
                              disabled={deleteLoading}
                              className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(loc.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Inactive locations are hidden from customers but retained for historical bookings.
        Locations linked to existing bookings will be deactivated instead of deleted.
      </p>
    </div>
  );
}
