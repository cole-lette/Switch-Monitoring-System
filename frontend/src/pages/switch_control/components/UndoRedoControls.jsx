import React from "react";
import { RotateCcw, RotateCw } from "lucide-react";

export default function UndoRedoControls({ onUndo, onRedo, canUndo, canRedo, t }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded ${
          canUndo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        }`}
        title={t("Undo (Control + Z)")}
      >
        <RotateCcw size={18} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded ${
          canRedo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        }`}
        title={t("Redo (Control + Shift + Z)")}
      >
        <RotateCw size={18} />
      </button>
    </div>
  );
}
