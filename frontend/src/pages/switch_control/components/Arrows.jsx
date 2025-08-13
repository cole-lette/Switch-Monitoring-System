import React, { useState, useEffect, useRef } from "react";

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14H7L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const arrowColors = ["black", "red", "blue", "green", "orange"];
const lineStyles = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "5,5" },
  { label: "Dotted", value: "1,5" },
];
const arrowHeads = [
  { label: "Arrow", value: "default" },
  { label: "Circle", value: "circle" },
  { label: "None", value: "none" },
];

export default function Arrows({
  connections,
  connectionInProgress,
  getAnchorCanvasPosition,
  createConnectionPath,
  handleRemoveConnection,
  setConnections,
  darkMode = false,
  t
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const menuRef = useRef(null);

  // Store widths of labels dynamically: { [index]: width }
  const [labelWidths, setLabelWidths] = useState({});
  // Refs for each text element to measure
  const textRefs = useRef({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectedIndex !== null &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setSelectedIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedIndex]);

  // Measure text widths after render whenever connections or selected index changes
  useEffect(() => {
    if (selectedIndex !== null && textRefs.current[selectedIndex]) {
      const el = textRefs.current[selectedIndex];
      if (el) {
        const bbox = el.getBBox();
        setLabelWidths((prev) => ({
          ...prev,
          [selectedIndex]: bbox.width + 20, // 10px padding on each side
        }));
      }
    }
  }, [connections, selectedIndex]);

  const updateConnection = (index, changes) => {
    setConnections((prev) =>
      prev.map((conn, i) => (i === index ? { ...conn, ...changes } : conn))
    );
  };

  const getMidPoint = (start, end) => ({
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  });

  const getPathByType = (start, end, lineType, fromAnchor, toAnchor) => {
    if (lineType === "orthogonal") {
      const midX = (start.x + end.x) / 2;
      return `M${start.x},${start.y} L${midX},${start.y} L${midX},${end.y} L${end.x},${end.y}`;
    } else if (lineType === "straight") {
      return `M${start.x},${start.y} L${end.x},${end.y}`;
    }
    return createConnectionPath(start, end, fromAnchor, toAnchor);
  };

  const markerDefs = [];
  const usedMarkers = new Set();

  connections.forEach((conn) => {
    const color = conn.color || "black";
    const arrowType = conn.arrowHead || "default";
    const strokeWidth = conn.strokeWidth || 2;
    const markerId = `arrow-${arrowType}-${color}`;

    if (!usedMarkers.has(markerId)) {
      usedMarkers.add(markerId);

      const effectiveScale = Math.sqrt(strokeWidth); // slower scaling
      if (arrowType === "default") {
        // Base sizes for default arrowhead
        const baseWidth = 10;
        const baseHeight = 7;
        const width = baseWidth * effectiveScale;
        const height = baseHeight * effectiveScale;
        const refX = width;
        const refY = height / 2;

        // Scaled triangle path (points)
        // M0,0 Lwidth,refY L0,height Z
        const pathD = `M0,0 L${width},${refY} L0,${height} Z`;

        markerDefs.push(
          <marker
            key={markerId}
            id={markerId}
            markerWidth={width}
            markerHeight={height}
            refX={refX}
            refY={refY}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d={pathD} fill={color} />
          </marker>
        );
      } else if (arrowType === "circle") {
        const baseSize = 6;
        const baseRadius = 3;
        const size = baseSize * effectiveScale;
        const radius = baseRadius * effectiveScale;
        const refCoord = size / 2;

        markerDefs.push(
          <marker
            key={markerId}
            id={markerId}
            markerWidth={size}
            markerHeight={size}
            refX={refCoord}
            refY={refCoord}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <circle cx={refCoord} cy={refCoord} r={radius} fill={color} />
          </marker>
        );
      }
    }
  });




 return (
  <svg
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      userSelect: "none",
      zIndex: 1,
      overflow: "visible",
    }}
  >
    <defs>{markerDefs}</defs>

    {connections.map((conn, i) => {
      const start = getAnchorCanvasPosition(conn.fromNodeId, conn.fromAnchor);
      const end = getAnchorCanvasPosition(conn.toNodeId, conn.toAnchor);

      const lineType = conn.lineType || "bezier";
      const path = getPathByType(start, end, lineType, conn.fromAnchor, conn.toAnchor);

      const strokeColor = conn.color || "black";
      const strokeDasharray = conn.lineStyle === "solid" ? undefined : conn.lineStyle;
      const arrowHeadType = conn.arrowHead || "default";
      const strokeWidth = conn.strokeWidth || 2;

      const markerEnd =
        arrowHeadType === "none" ? "none" : `url(#arrow-${arrowHeadType}-${strokeColor})`;

      const mid = getMidPoint(start, end);
      const rectWidth = labelWidths[i] || 80;

      return (
        <g key={i} style={{ pointerEvents: "auto" }}>
          {/* Invisible thick path for easier clicking */}
          <path
            d={path}
            stroke="transparent"
            strokeWidth={15}
            fill="none"
            pointerEvents="stroke"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(i === selectedIndex ? null : i);
            }}
          />

          {/* Visible connection path */}
          <path
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            markerEnd={markerEnd}
            pointerEvents="none"
          />

          {/* Label with background */}
          {conn.label && (
            <g pointerEvents="none">
              <rect
                x={mid.x - rectWidth / 2}
                y={mid.y - 25}
                width={rectWidth}
                height={20}
                fill={darkMode ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)"}
                rx={4}
                ry={4}
              />
              <text
                ref={(el) => (textRefs.current[i] = el)}
                x={mid.x}
                y={mid.y - 10}
                textAnchor="middle"
                fontSize="12"
                fill={darkMode ? "white" : "black"}
                style={{ userSelect: "none", fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
              >
                {conn.label}
              </text>
            </g>
          )}
        </g>
      );
    })}

    {/* Popup menu rendered on top */}
    {selectedIndex !== null && (() => {
      const conn = connections[selectedIndex];
      if (!conn) return null;

      const start = getAnchorCanvasPosition(conn.fromNodeId, conn.fromAnchor);
      const end = getAnchorCanvasPosition(conn.toNodeId, conn.toAnchor);
      const mid = getMidPoint(start, end);

      return (
        <foreignObject
          x={mid.x - 140}
          y={mid.y - 75}
          width={280}
          height={240}
          style={{ pointerEvents: "auto", overflow: "visible", zIndex: 9999 }}
        >
          <div
            ref={menuRef}
            className="flex flex-col gap-2 p-3 w-[280px] rounded-lg border text-sm relative
             bg-white text-gray-900 border-gray-300 shadow-md
             dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:shadow-lg"
            style={{ zIndex: 9999 }}
          >
            {/* Delete button */}
            <button
              onClick={() => {
                handleRemoveConnection(selectedIndex);
                setSelectedIndex(null);
              }}
              title={t("Delete Connection")}
              type="button"
              className="flex items-center self-start p-1 text-red-600 cursor-pointer hover:text-red-700"
            >
              <TrashIcon />
              <span className="ml-1">{t("Delete")}</span>
            </button>

            {/* Color selector */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Color")}</span>
              <select
                value={conn.color || "black"}
                onChange={(e) =>
                  updateConnection(selectedIndex, { color: e.target.value })
                }
                className="px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md h-7 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              >
                {arrowColors.map((color) => (
                  <option key={color} value={color}>
                    {t(color.charAt(0).toUpperCase() + color.slice(1))}
                  </option>
                ))}
              </select>
            </label>

            {/* Line style selector */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Line Style")}</span>
              <select
                value={conn.lineStyle || "solid"}
                onChange={(e) =>
                  updateConnection(selectedIndex, { lineStyle: e.target.value })
                }
                className="px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md h-7 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              >
                {lineStyles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {t(style.label)}
                  </option>
                ))}
              </select>
            </label>

            {/* Arrowhead selector */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Arrowhead")}</span>
              <select
                value={conn.arrowHead || "default"}
                onChange={(e) =>
                  updateConnection(selectedIndex, { arrowHead: e.target.value })
                }
                className="px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md h-7 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              >
                {arrowHeads.map((head) => (
                  <option key={head.value} value={head.value}>
                    {t(head.label)}
                  </option>
                ))}
              </select>
            </label>

            {/* Line Type selector */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Line Type")}</span>
              <select
                value={conn.lineType || "bezier"}
                onChange={(e) =>
                  updateConnection(selectedIndex, { lineType: e.target.value })
                }
                className="px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md h-7 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              >
                <option value="bezier">{t("Bezier")}</option>
                <option value="orthogonal">{t("Orthogonal")}</option>
                <option value="straight">{t("Straight")}</option>
              </select>
            </label>

            {/* Line Thickness slider */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Line Thickness")}</span>
              <input
                type="range"
                min="1"
                max="10"
                value={conn.strokeWidth || 2}
                onChange={(e) =>
                  updateConnection(selectedIndex, {
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </label>

            {/* Label input */}
            <label className="flex flex-col">
              <span className="mb-1 font-medium">{t("Label")}</span>
              <input
                type="text"
                value={conn.label || ""}
                onChange={(e) =>
                  updateConnection(selectedIndex, { label: e.target.value })
                }
                className="px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md h-7 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                placeholder={t("Optional connection label")}
              />
            </label>
          </div>
        </foreignObject>
      );
    })()}

    {connectionInProgress && (() => {
      const start = connectionInProgress.fromPos;
      const end = connectionInProgress.toPos;
      const path = createConnectionPath(start, end);
      return (
        <path
          d={path}
          stroke="gray"
          strokeWidth={2}
          fill="none"
          strokeDasharray="5,5"
          markerEnd="url(#arrow-default-black)"
        />
      );
    })()}
  </svg>
);

}
