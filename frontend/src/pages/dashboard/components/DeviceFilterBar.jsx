import React, { useState, useEffect } from "react";

export default function DeviceFilterBar({
  t,
  searchQuery,
  setSearchQuery,
  isOnFilter,
  setIsOnFilter,
  selectedCanvasId,
  setSelectedCanvasId,
  canvasLayouts = [],
  onRenameCanvas,
  onDeleteCanvas,
}) {
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const isShowAll = selectedCanvasId === "all";


  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setRenameModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleRename = () => {
    if (!newCanvasName.trim()) return;
    onRenameCanvas(newCanvasName.trim());
    setRenameModalOpen(false);
    setNewCanvasName("");
  };

  const Modal = ({ title, onClose, children }) => (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-md p-6 bg-white rounded shadow-lg dark:bg-gray-800">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>
          {children}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search and Power Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder={t("Search by name or ID")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[250px] px-3 py-2 text-sm bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
        />

        <select
          value={isOnFilter}
          onChange={(e) => setIsOnFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="all">{t("All")}</option>
          <option value="on">{t("Power ON")}</option>
          <option value="off">{t("Power OFF")}</option>
        </select>
      </div>

      {/* Right: Canvas Layout Selector + Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="mr-2 font-medium" htmlFor="canvas-select">
          {t("Select Canvas")} :
        </label>
        <select
          id="canvas-select"
          value={selectedCanvasId || ""}
          onChange={(e) => setSelectedCanvasId(e.target.value)}
          aria-label={t("Canvas layout selector")}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="" disabled>
            {t("Select a canvas layout")}
          </option>

          {/* Show All Option */}
          <option value="all">{t("Show All")}</option>

          {/* Other Canvas Layouts */}
          {canvasLayouts.map((layout) => {
            const id = layout.canvasId || layout._id;
            return (
              <option key={id} value={id}>
                {layout.canvasName || `Canvas ${id}`}
              </option>
            );
          })}

          {canvasLayouts.length === 0 && (
            <option disabled>{t("No layouts available")}</option>
          )}
        </select>


        <button
          onClick={() => setRenameModalOpen(true)}
          className="px-3 py-2 text-sm text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedCanvasId || isShowAll}
        >
          {t("Rename")}
        </button>

        <button
          onClick={() => onDeleteCanvas()}
          className="px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedCanvasId || isShowAll}
        >
          {t("Delete")}
        </button>

      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <Modal title={t("Rename Canvas")} onClose={() => setRenameModalOpen(false)}>
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              placeholder={t("Enter new name")}
              value={newCanvasName}
              onChange={(e) => setNewCanvasName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
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
                disabled={!newCanvasName.trim()}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {t("Save")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
