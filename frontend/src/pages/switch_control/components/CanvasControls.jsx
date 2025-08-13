import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";

export default function CanvasControls({
  selectedCanvasId,
  setSelectedCanvasId,
  canvasList,
  nodes,
  positions,
  connections,
  scale,
  translate,
  onCanvasUpdated,
  currentCanvasName,
  setCurrentCanvasName,
  showDetails,
  setShowDetails,
  t,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  const toggleShowDetails = () => {
    setShowDetails(prev => !prev);
  };


  useEffect(() => {
    if (selectedCanvasId === "new" || !selectedCanvasId) {
      setCurrentCanvasName("");
    } else {
      const found = canvasList.find((c) => c.canvasId === selectedCanvasId);
      setCurrentCanvasName(found ? found.canvasName || found.canvasId : "");
    }
  }, [selectedCanvasId, canvasList]);

  useEffect(() => {
    if (!isModalOpen) setNewCanvasName("");
  }, [isModalOpen]);

  // Modal component with React Portal and click outside to close
  const Modal = ({ onClose, title, children }) =>
    ReactDOM.createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={onClose}
        />
        {/* Modal content */}
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md p-6 bg-white rounded dark:bg-gray-800">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-2xl font-bold leading-none text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>
            {children}
          </div>
        </div>
      </>,
      document.body
    );

  const saveCanvas = async (canvasIdToUse, canvasName = "") => {
    setIsSaving(true);
    try {
      const payload = {
        canvasId: canvasIdToUse,
        canvasName: canvasName,
        nodes,
        positions,
        connections,
        scale,
        translate: {
          x: translate?.x ?? 0,
          y: translate?.y ?? 0,
        },
      };

      const response = await fetch("http://localhost:5000/api/canvas/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save canvas");

      const result = await response.json();

      toast.success("Canvas saved successfully");
      setSelectedCanvasId(result.canvasId || canvasIdToUse);
      if (onCanvasUpdated) onCanvasUpdated();
      setModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving canvas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!selectedCanvasId || selectedCanvasId === "new") {
      setModalOpen(true);
    } else {
      saveCanvas(selectedCanvasId, currentCanvasName);
    }
  };

  const handleDelete = async () => {
    if (!selectedCanvasId || selectedCanvasId === "new") return;
    const confirmed = window.confirm("Are you sure you want to delete this canvas?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/canvas/${selectedCanvasId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete canvas");

      toast.success("Canvas deleted");

      const filteredList = canvasList.filter((c) => c.canvasId !== selectedCanvasId);
      if (filteredList.length > 0) setSelectedCanvasId(filteredList[0].canvasId);
      else setSelectedCanvasId("new");

      if (onCanvasUpdated) onCanvasUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete canvas");
    }
  };

  const handleSaveNewCanvas = () => {
    const trimmedName = newCanvasName.trim();
    if (!trimmedName) return;
    const id = `canvas-${Date.now()}`;
    saveCanvas(id, trimmedName);
  };

  const handleRename = async () => {
    if (!renameInput.trim()) return;
    try {
      const response = await fetch(`http://localhost:5000/api/canvas/rename/${selectedCanvasId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ canvasName: renameInput }),
      });

      if (!response.ok) throw new Error("Rename failed");

      toast.success("Canvas renamed successfully");
      setRenameModalOpen(false);
      setCurrentCanvasName(renameInput);  // Update parent state here
      if (onCanvasUpdated) onCanvasUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename canvas");
    }
  };


  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleShowDetails}
        className="px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {showDetails ? t("Hide Details") : t("Show Details")}
      </button>

      <select
        value={selectedCanvasId || "new"}
        onChange={(e) => setSelectedCanvasId(e.target.value)}
        className="px-3 py-2 text-sm transition bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="new">+ {t("New Canvas")}</option>
        {canvasList.map((canvas) => (
          <option key={canvas.canvasId} value={canvas.canvasId}>
            {canvas.canvasName || canvas.canvasId}
          </option>
        ))}
      </select>

      <button
        onClick={handleSave}
        disabled={isSaving}
        data-canvas-save="true"
        className="px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {t("Save")}
      </button>

      <button
        onClick={handleDelete}
        disabled={!selectedCanvasId || selectedCanvasId === "new" || isSaving}
        className="px-4 py-2 text-sm font-semibold text-white transition bg-red-600 rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {t("Delete")}
      </button>

      <button
        onClick={() => {
          setRenameInput(currentCanvasName);
          setRenameModalOpen(true);
        }}
        disabled={!selectedCanvasId || selectedCanvasId === "new" || isSaving}
        className="px-4 py-2 text-sm font-semibold text-white transition bg-yellow-600 rounded-lg shadow-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        {t("Rename")}
      </button>


      {/* New Canvas Name Modal */}
      {isModalOpen && (
        <Modal onClose={() => setModalOpen(false)} title="Name your new canvas">
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              placeholder="Canvas Name"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={newCanvasName}
              onChange={(e) => setNewCanvasName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCanvasName.trim()) {
                  handleSaveNewCanvas();
                }
              }}
            />
            <button
              onClick={handleSaveNewCanvas}
              disabled={!newCanvasName.trim() || isSaving}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {t("Save New Canvas")}
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Canvas Modal */}
      {renameModalOpen && (
        <Modal onClose={() => setRenameModalOpen(false)} title="Rename Canvas">
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              placeholder="New canvas name"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleRename}
                disabled={!renameInput.trim()}
                className="px-4 py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {t("Rename")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
