"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  FolderLock,
  UploadCloud,
  File,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Download,
  Trash2,
  Search,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { FileItem } from "@/lib/types";

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.listFiles(searchQuery || undefined);
      setFiles(data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load files." });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileToUpload = selectedFiles[0];
    setIsUploading(true);
    setUploadProgress(20);
    setStatusMessage(null);

    try {
      setUploadProgress(60);
      await api.uploadFile(fileToUpload);
      setUploadProgress(100);
      setStatusMessage({
        type: "success",
        text: `Successfully uploaded ${fileToUpload.name}`,
      });
      fetchFiles();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to upload file.",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 1500);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await api.downloadFile(file.id, file.filename);
    } catch (err: any) {
      alert("Failed to download file: " + err.message);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${filename}'?`)) return;

    try {
      await api.deleteFile(id);
      fetchFiles();
      setStatusMessage({ type: "success", text: `Deleted ${filename}` });
    } catch (err: any) {
      alert("Failed to delete file: " + err.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext || "")) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    if (["pdf", "txt", "md", "csv", "json"].includes(ext || "")) {
      return <FileText className="w-5 h-5 text-cyan-400" />;
    }
    return <File className="w-5 h-5 text-emerald-400" />;
  };

  const totalBytes = files.reduce((acc, f) => acc + f.file_size, 0);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Secure File Manager"
          subtitle="Encrypted document storage, upload pipelines, and access auditing"
        />

        <main className="p-8 space-y-8 max-w-7xl">
          {/* Storage Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Storage Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {files.length} secure documents stored &bull; {formatSize(totalBytes)} used
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload New File</span>
              </button>
            </div>
          </div>

          {/* Progress / Status banner */}
          {uploadProgress !== null && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span>Uploading encrypted payload...</span>
                <span className="font-semibold text-emerald-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search files by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* File Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading file metadata...
              </div>
            ) : files.length === 0 ? (
              <div className="py-20 text-center">
                <FolderLock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">No files found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Upload reports, security keys, or encrypted audits to keep them safely partitioned.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">File Name</th>
                      <th className="py-3.5 px-6">Size</th>
                      <th className="py-3.5 px-6">Format</th>
                      <th className="py-3.5 px-6">Upload Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-800/40 transition group"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                              {getFileIcon(file.filename)}
                            </div>
                            <span className="font-semibold text-slate-100 group-hover:text-emerald-400 transition truncate max-w-xs">
                              {file.filename}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-400 font-mono">
                          {formatSize(file.file_size)}
                        </td>
                        <td className="py-3.5 px-6 text-slate-400">
                          {file.content_type || "application/octet-stream"}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDownload(file)}
                              title="Download file"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id, file.filename)}
                              title="Delete file"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
