import { useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import { generatePassword } from "@/lib/crypto";

interface Props {
  onSelect?: (password: string) => void;
}

export default function PasswordGenerator({ onSelect }: Props) {
  const [length, setLength] = useState(20);
  const [password, setPassword] = useState(() => generatePassword(20));
  const [copied, setCopied] = useState(false);

  const regenerate = () => setPassword(generatePassword(length));

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Strength score (0-4)
  const strength = Math.min(
    4,
    [/.{12,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  );
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Muy débil", "Débil", "Regular", "Buena", "Excelente"];

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Generador de contraseñas</span>
        <span className="text-xs text-gray-500 dark:text-slate-400">{length} caracteres</span>
      </div>

      <input
        type="range"
        min={8}
        max={64}
        value={length}
        onChange={(e) => {
          const l = Number(e.target.value);
          setLength(l);
          setPassword(generatePassword(l));
        }}
        className="w-full accent-primary-600"
      />

      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 font-mono break-all">
          {password}
        </code>
        <button
          onClick={regenerate}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Regenerar"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={copy}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Copiar"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= strength ? strengthColors[strength] : "bg-gray-200 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400">{strengthLabels[strength]}</span>
      </div>

      {onSelect && (
        <button
          onClick={() => onSelect(password)}
          className="w-full text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          Usar esta contraseña
        </button>
      )}
    </div>
  );
}
