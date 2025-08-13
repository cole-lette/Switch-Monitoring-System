import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export default function ZoomControls({ onZoomIn, onZoomOut, t }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onZoomOut}
        className="p-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        title={t("Zoom Out (Control + Scroll Down)")}
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={onZoomIn}
        className="p-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        title={t("Zoom In (Control + Scroll Up)")}
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
}
