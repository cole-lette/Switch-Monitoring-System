import React, { useMemo } from "react";

export default function MiniMap({
  nodes = [],
  positions = {},
  scale,
  translate,
  onNavigate,
  width = 200,
  height = 150,
  padding = 5,
  canvasWidth = 800,
  canvasHeight = 600,
}) {
  // The node size on the main canvas
  const nodeWidth = 140;
  const nodeHeight = 140;

  // Calculate bounding box covering all nodes + viewport (including node sizes!)
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: canvasWidth,
        maxY: canvasHeight,
        width: canvasWidth,
        height: canvasHeight,
      };
    }

    // Get X and Y of nodes including their width/height
    const allX = nodes.map((n) => positions[n.id]?.x ?? 0);
    const allY = nodes.map((n) => positions[n.id]?.y ?? 0);

    const minNodeX = Math.min(...allX);
    const maxNodeX = Math.max(...allX.map(x => x + nodeWidth));

    const minNodeY = Math.min(...allY);
    const maxNodeY = Math.max(...allY.map(y => y + nodeHeight));

    // Current viewport in canvas coordinates
    const viewportX = -translate.x / scale;
    const viewportY = -translate.y / scale;
    const viewportWidth = canvasWidth / scale;
    const viewportHeight = canvasHeight / scale;

    // Calculate combined bounding box of nodes and viewport
    const minX = Math.min(minNodeX, viewportX);
    const maxX = Math.max(maxNodeX, viewportX + viewportWidth);
    const minY = Math.min(minNodeY, viewportY);
    const maxY = Math.max(maxNodeY, viewportY + viewportHeight);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX || 1,
      height: maxY - minY || 1,
    };
  }, [nodes, positions, canvasWidth, canvasHeight, translate, scale]);

  // Calculate scale to fit all content inside minimap area (minus padding)
  const scaleX = (width - 2 * padding) / bounds.width;
  const scaleY = (height - 2 * padding) / bounds.height;
  const miniScale = Math.min(scaleX, scaleY, 1);

  // Offset to align bounding box inside minimap with padding
  const offsetX = padding - bounds.minX * miniScale;
  const offsetY = padding - bounds.minY * miniScale;

  // Calculate viewport rectangle in minimap coordinates (scaled + offset)
  const viewportX = -translate.x / scale;
  const viewportY = -translate.y / scale;
  const viewportWidth = canvasWidth / scale;
  const viewportHeight = canvasHeight / scale;

  const rawViewportLeft = viewportX * miniScale + offsetX;
  const rawViewportTop = viewportY * miniScale + offsetY;
  const rawViewportWidth = viewportWidth * miniScale;
  const rawViewportHeight = viewportHeight * miniScale;

  // Clamp helper with safeguard for inverted ranges
  const clamp = (value, min, max) => {
    if (min > max) return min;
    return Math.min(Math.max(value, min), max);
  };

  // Max viewport size inside minimap content area (accounting for padding)
  const maxViewportWidth = width - 2 * padding;
  const maxViewportHeight = height - 2 * padding;

  // Clamp viewport box position and size inside minimap
  const clampedViewportWidth = Math.min(rawViewportWidth, maxViewportWidth);
  const clampedViewportHeight = Math.min(rawViewportHeight, maxViewportHeight);

  const clampedViewportLeft = clamp(
    rawViewportLeft,
    padding,
    width - padding - clampedViewportWidth
  );
  const clampedViewportTop = clamp(
    rawViewportTop,
    padding,
    height - padding - clampedViewportHeight
  );

  // Handle minimap click to navigate
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const canvasClickX = (clickX - offsetX) / miniScale;
    const canvasClickY = (clickY - offsetY) / miniScale;

    const newTranslateX = -canvasClickX * scale + canvasWidth / 2;
    const newTranslateY = -canvasClickY * scale + canvasHeight / 2;

    onNavigate({ x: newTranslateX, y: newTranslateY });
  };

  return (
    <div
      className="relative bg-gray-200 border rounded cursor-pointer dark:bg-gray-700"
      style={{ width, height, userSelect: "none" }}
      onClick={handleClick}
    >
      {/* Debug: minimap content area inside padding */}
      <div
        style={{
          position: "absolute",
          left: padding,
          top: padding,
          width: width - 2 * padding,
          height: height - 2 * padding,
          pointerEvents: "none",
          boxSizing: "border-box",
          zIndex: 10,
        }}
      />

      {/* Render nodes as dots */}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;

        const dotSize = 8;

        // Calculate node center in minimap coords
        const centerX = (pos.x + nodeWidth / 2) * miniScale + offsetX;
        const centerY = (pos.y + nodeHeight / 2) * miniScale + offsetY;

        // Clamp inside minimap content area with dot radius
        const clampedX = clamp(centerX, padding + dotSize / 2, width - padding - dotSize / 2);
        const clampedY = clamp(centerY, padding + dotSize / 2, height - padding - dotSize / 2);

        return (
          <div
            key={node.id}
            title={node.name || `Node ${node.id}`}
            className="absolute transition-transform duration-200 border-2 border-white rounded-full shadow-lg cursor-pointer bg-gradient-to-tr from-blue-600 to-blue-400 hover:scale-125 hover:z-10"
            style={{
              width: dotSize,
              height: dotSize,
              left: clampedX - dotSize / 2,
              top: clampedY - dotSize / 2,
              boxSizing: "border-box",
            }}
          />
        );
      })}

      {/* Viewport rectangle */}
      <div
        className="absolute border-2 border-red-500 pointer-events-none"
        style={{
          left: clampedViewportLeft,
          top: clampedViewportTop,
          width: clampedViewportWidth,
          height: clampedViewportHeight,
          boxSizing: "border-box",
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          zIndex: 5,
        }}
      />
    </div>
  );
}
  