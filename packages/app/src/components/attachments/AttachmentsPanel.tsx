import { useRef, useState } from "react";
import { Paperclip, Upload, Trash2, FileText, Image, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Props {
  ticketId?: string;
  noteId?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsPanel({ ticketId, noteId }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const queryKey = ["attachments", ticketId ?? noteId];

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey,
    queryFn: () =>
      api
        .get("/attachments", { params: ticketId ? { ticketId } : { noteId } })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/attachments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (ticketId) form.append("ticketId", ticketId);
      if (noteId) form.append("noteId", noteId);
      await api.post("/attachments", form, { headers: { "Content-Type": "multipart/form-data" } });
      qc.invalidateQueries({ queryKey });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Error al subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
          <Paperclip size={14} />
          Adjuntos {attachments.length > 0 && `(${attachments.length})`}
        </h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
        >
          <Upload size={13} />
          {uploading ? "Subiendo..." : "Subir"}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <X size={12} />
          {error}
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700"
            >
              <div className="shrink-0 text-gray-400 dark:text-slate-500">
                {isImage(att.mimeType) ? <Image size={16} /> : <FileText size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={`${BASE_URL}/attachments/${att.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-gray-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                >
                  {att.originalName}
                </a>
                <p className="text-xs text-gray-400 dark:text-slate-500">{formatBytes(att.size)}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(att.id)}
                disabled={deleteMutation.isPending}
                className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
