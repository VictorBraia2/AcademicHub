import { useState } from "react";

interface NoteEditorProps {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
}

export function NoteEditor({ initialNotes, onSave }: NoteEditorProps) {
  const [notesValue, setNotesValue] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleBlur() {
    if (notesValue === initialNotes) return;
    setSaveStatus("saving");
    await onSave(notesValue);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  return (
    <div>
      <textarea
        value={notesValue}
        onChange={(e) => setNotesValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Suas anotações sobre esta fonte…"
        rows={3}
        className="field-input w-full text-sm resize-y"
      />
      <p className="text-xs text-ink/40 mt-1 h-4">
        {saveStatus === "saving" && "Salvando…"}
        {saveStatus === "saved" && "Anotação salva."}
      </p>
    </div>
  );
}
