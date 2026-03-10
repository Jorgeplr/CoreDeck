import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MDEditor from "@uiw/react-md-editor";
import { contextApi } from "../api/contextApi";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ["context", "note", id],
    queryFn: () => contextApi.getNote(id!),
    enabled: !!id,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content ?? "");
    }
  }, [note]);

  const mutation = useMutation({
    mutationFn: () => contextApi.updateNote(id!, { title, content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "notes"] }),
  });

  if (isLoading) return <div className="text-gray-400 py-16 text-center">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-xl font-bold bg-transparent text-gray-900 dark:text-white border-none outline-none"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Save size={15} />
          {mutation.isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div data-color-mode="auto">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val ?? "")}
          height={500}
          preview="live"
        />
      </div>
    </div>
  );
}
