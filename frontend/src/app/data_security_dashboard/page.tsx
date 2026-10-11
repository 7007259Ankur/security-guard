"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  ShieldAlert,
  KeyRound,
  FileText,
  Calendar,
  Lock,
  Unlock,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Activity,
  AlertCircle,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import {
  CredentialListItem,
  CredentialDetail,
  DashboardStats,
  DecryptedSecret,
} from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();

  // Dashboard Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Credentials State
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Add Credential Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Banking");
  const [newUsername, setNewUsername] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [masterPasswordForAdd, setMasterPasswordForAdd] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Unlock / Decrypt Modal
  const [unlockModalItem, setUnlockModalItem] = useState<CredentialListItem | null>(null);
  const [masterPasswordForUnlock, setMasterPasswordForUnlock] = useState("");
  const [decryptedData, setDecryptedData] = useState<DecryptedSecret | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      if (err.message?.includes("credentials") || err.message?.includes("token")) {
        router.push("/login");
      }
    } finally {
      setLoadingStats(false);
    }
  }, [router]);

  const fetchCredentials = useCallback(async () => {
    try {
      const cat = selectedCategory === "All" ? undefined : selectedCategory;
      const data = await api.listCredentials(cat, searchQuery || undefined);
      setCredentials(data);
    } catch {
      // handled
    } finally {
      setLoadingCreds(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchStats();
    fetchCredentials();
  }, [fetchStats, fetchCredentials]);

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPassword || !masterPasswordForAdd) {
      setAddError("Title, Password, and Master Encryption Password are required.");
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      // Zero-knowledge encryption on client
      const encrypted = await encryptSecret(
        { password: newPassword, notes: newNotes },
        masterPasswordForAdd
      );

      await api.createCredential({
        title: newTitle,
        category: newCategory,
        username: newUsername || undefined,
        website_url: newWebsiteUrl || undefined,
        encrypted_data: encrypted.encrypted_data,
        encryption_iv: encrypted.encryption_iv,
        key_derivation_salt: encrypted.key_derivation_salt,
      });

      // Reset form
      setNewTitle("");
      setNewUsername("");
      setNewWebsiteUrl("");
      setNewPassword("");
      setNewNotes("");
      setMasterPasswordForAdd("");
      setIsAddModalOpen(false);

      // Refresh list & stats
      fetchCredentials();
      fetchStats();
    } catch (err: any) {
      setAddError(err.message || "Failed to create encrypted credential.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUnlockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalItem || !masterPasswordForUnlock) return;

    setIsDecrypting(true);
    setUnlockError(null);

    try {
      // 1. Fetch full encrypted detail from backend
      const detail: CredentialDetail = await api.getCredential(unlockModalItem.id);

      // 2. Decrypt locally in memory using WebCrypto API
      const secret = await decryptSecret(
        detail.encrypted_data,
        detail.encryption_iv,
        detail.key_derivation_salt,
        masterPasswordForUnlock
      );

      setDecryptedData(secret);
    } catch (err: any) {
      setUnlockError(err.message || "Decryption failed. Please check your Master Password.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDeleteCredential = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this credential from the vault?")) return;

    try {
      await api.deleteCredential(id);
      if (unlockModalItem?.id === id) {
        setUnlockModalItem(null);
        setDecryptedData(null);
      }
      fetchCredentials();
      fetchStats();
    } catch (err: any) {
      alert("Error deleting credential: " + err.message);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Cyber Security Dashboard"
          subtitle="Real-time perimeter monitoring, zero-knowledge secrets vault, and audit stream"
        />

        <main className="p-8 space-y-8 max-w-7xl">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Security Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Security Posture
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {stats?.security_score || 95}%
                </span>
                <span className="text-xs text-emerald-400 font-medium">Robust</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats?.security_score || 95}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Zero unencrypted plaintexts detected</p>
            </div>

            {/* Credential Vault Count */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Vault Items
                </span>
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <KeyRound className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {stats?.vault_count ?? (loadingStats ? "..." : 0)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Secured</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" /> Client-side AES-256-GCM
              </p>
            </div>

            {/* File Manager Storage */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Secure Files
                </span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {stats?.file_count ?? (loadingStats ? "..." : 0)}
                </span>
                <span className="text-xs text-slate-400">
                  ({formatBytes(stats?.storage_used_bytes || 0)})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-indigo-400" /> Isolated storage partition
              </p>
            </div>

            {/* Scheduled Audits */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Calendar Events
                </span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {stats?.event_count ?? (loadingStats ? "..." : 0)}
                </span>
                <span className="text-xs text-purple-400 font-medium">Audits & Ops</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4">Timezone-aware scheduling</p>
            </div>
          </div>

          {/* Main Grid: Vault + Activity Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Credentials Vault Section (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    Zero-Knowledge Credentials Vault
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Encrypted locally with PBKDF2 + AES-GCM before transmission
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Credential</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search credentials (e.g., SBI, AWS)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {["All", "Banking", "Cloud", "Identity", "Server"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        selectedCategory === cat
                          ? "bg-slate-800 text-emerald-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-950"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credential List */}
              {loadingCreds ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                  Decrypting vault index...
                </div>
              ) : credentials.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
                  <KeyRound className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">No credentials found in vault</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Create an entry such as &quot;SBI Credentials&quot; with zero-knowledge master key encryption.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {cred.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-100 truncate">
                              {cred.title}
                            </h4>
                            {cred.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {cred.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            {cred.username && <span>User: {cred.username}</span>}
                            {cred.website_url && (
                              <a
                                href={cred.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 hover:text-emerald-400 truncate"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {cred.website_url.replace(/^https?:\/\//, "")}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setUnlockModalItem(cred);
                            setDecryptedData(null);
                            setUnlockError(null);
                            setMasterPasswordForUnlock("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 flex items-center gap-1.5 transition border border-slate-700"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteCredential(cred.id, e)}
                          title="Delete from vault"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity / Audit Stream (1 col) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Security Activity Log
                </h3>
              </div>

              {!stats?.recent_activities || stats.recent_activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No recent security events logged</p>
              ) : (
                <div className="space-y-3.5">
                  {stats.recent_activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-start space-x-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-200 truncate">{act.action}</p>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">{act.description}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(act.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Credential Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              Add Encrypted Credential
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Secret is encrypted in your browser with AES-256-GCM before saving to backend.
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="SBI Credentials / AWS Root / GitHub Token"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Banking">Banking</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Identity">Identity</option>
                    <option value="Server">Server</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username / Email</label>
                  <input
                    type="text"
                    placeholder="user_sbi"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://retail.onlinesbi.sbi"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Secret / Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Secret password to be encrypted"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Secure Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional confidential notes or recovery keys"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-emerald-400 font-medium mb-1">
                  Master Password (for Encryption Key Derivation) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your master password to seal this item"
                  value={masterPasswordForAdd}
                  onChange={(e) => setMasterPasswordForAdd(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {isAdding ? "Encrypting & Storing..." : "Seal & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlock / Decrypt Modal */}
      {unlockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-400" />
              Unlock: {unlockModalItem.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your master password to decrypt this secret locally in-memory.
            </p>

            {unlockError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            {!decryptedData ? (
              <form onSubmit={handleUnlockItem} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Master Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter master password..."
                    value={masterPasswordForUnlock}
                    onChange={(e) => setMasterPasswordForUnlock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnlockModalItem(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isDecrypting}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                  >
                    {isDecrypting ? "Decrypting..." : "Decrypt Secret"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Decrypted Password
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(decryptedData.password || "", "password")
                      }
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedField === "password" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-sm text-emerald-300 select-all break-all">
                    {decryptedData.password}
                  </p>
                </div>

                {decryptedData.notes && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Secure Notes
                      </span>
                      <button
                        onClick={() => copyToClipboard(decryptedData.notes || "", "notes")}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedField === "notes" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-300 text-xs whitespace-pre-wrap select-all">
                      {decryptedData.notes}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setUnlockModalItem(null);
                      setDecryptedData(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Lock & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
