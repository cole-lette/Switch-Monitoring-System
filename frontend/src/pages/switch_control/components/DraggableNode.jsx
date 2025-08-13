import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { Trash2, Settings, Lock, Unlock } from "lucide-react";

function CircuitSwitch({
  isOn,
  size = "md",
  label,
  onToggle,
  disabled = false,
}) {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const sizeClasses = {
    sm: { switch: "w-6 h-14", handle: "w-4 h-4" },
    md: { switch: "w-8 h-20", handle: "w-6 h-6" },
    lg: { switch: "w-10 h-24", handle: "w-8 h-8" },
  };

  const handleMouseDown = (e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  };

  const handleMouseUp = (e) => {
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    const moved = dx > 5 || dy > 5;

    if (!moved && !disabled && onToggle) {
      onToggle();
    }
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative">
        <div
          className={classNames(
            "relative rounded-xl border-2 flex flex-col items-center justify-start cursor-pointer transition-all duration-300 ease-in-out",
            sizeClasses[size].switch,
            isOn ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
          )}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <img
            src="https://images.pexels.com/photos/6499182/pexels-photo-6499182.jpeg"
            alt="Circuit Breaker"
            className="absolute inset-0 object-cover w-full h-full rounded-xl opacity-10"
            draggable={false}
          />

          {/* Handle */}
          <div
            className={classNames(
              "absolute w-full h-1/2 rounded-t-sm bg-gray-300 transition-transform duration-300",
              isOn ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="absolute bottom-0 w-4/5 h-2 transform -translate-x-1/2 bg-gray-400 rounded-t-sm left-1/2"></div>
          </div>

          {/* Status lights */}
          <div className="absolute w-1.5 h-1.5 transform -translate-x-1/2 bg-green-500 rounded-full top-1 left-1/2"></div>
          <div className="absolute w-1.5 h-1.5 transform -translate-x-1/2 bg-red-500 rounded-full bottom-1 left-1/2"></div>
        </div>
      </div>

      {label && (
        <span
          className={classNames(
            "mt-2 font-semibold tracking-wide truncate text-center",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
            isOn ? "text-green-700" : "text-red-700"
          )}
          style={{ maxWidth: "100px" }}
          title={label} // tooltip on hover
        >
          {label}
        </span>
      )}

    </div>
  );
}

function DraggableNode({
  node,
  position,
  onDrag,
  onDelete,
  onConfigure,
  scale,
  translate,
  onDragStart,
  onToggleSwitch,
  isOn,
  onConnectionStart,
  onConnectionMove,
  onConnectionEnd,
  onSelect,
  selectedNodeId,
  showDetails,
  canvasId,
  onLockToggle,
  t,
}) {
  const [dragging, setDragging] = useState(false);
  const [connectingAnchor, setConnectingAnchor] = useState(null);
  const offset = useRef({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const anchorRefs = {
    top: useRef(null),
    right: useRef(null),
    bottom: useRef(null),
    left: useRef(null),
  };


  // Drag node start
  const onMouseDown = (e) => {
    if (e.target.closest(".anchor-hitbox")) return; // ignore drag if anchor hitbox clicked

    e.stopPropagation();
    e.preventDefault();

    const canvasX = (e.clientX - translate.x) / scale;
    const canvasY = (e.clientY - translate.y) / scale;

    offset.current = { x: canvasX - position.x, y: canvasY - position.y };
    setDragging(true);
    onDragStart?.(node.id);
    onSelect?.(node.id);
  };

  // Drag node move
  const onMouseMove = (e) => {
    e.preventDefault();

    if (dragging) {
      const canvasX = (e.clientX - translate.x) / scale;
      const canvasY = (e.clientY - translate.y) / scale;

      const newX = canvasX - offset.current.x;
      const newY = canvasY - offset.current.y;

      onDrag(node.id, newX, newY);
      return;
    }

    if (connectingAnchor) {
      const canvasRect = nodeRef.current.parentElement.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      onConnectionMove?.(x, y);
    }
  };

  // Drag node end
  const onMouseUp = (e) => {
    e.preventDefault();
    setDragging(false);

    if (connectingAnchor) {
      onConnectionEnd?.(null, null);
      setConnectingAnchor(null);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, connectingAnchor]);

  // Get anchor position relative to viewport
  const getAnchorPosition = (side) => {
    if (!nodeRef.current) return { x: 0, y: 0 };
    const rect = nodeRef.current.getBoundingClientRect();
    const anchorSize = 14;
    const hitboxSize = 28;
    switch (side) {
      case "top":
        return {
          x: rect.left + rect.width / 2,
          y: rect.top - hitboxSize / 2 + anchorSize / 2,
        };
      case "right":
        return {
          x: rect.right + hitboxSize / 2 - anchorSize / 2,
          y: rect.top + rect.height / 2,
        };
      case "bottom":
        return {
          x: rect.left + rect.width / 2,
          y: rect.bottom + hitboxSize / 2 - anchorSize / 2,
        };
      case "left":
        return {
          x: rect.left - hitboxSize / 2 + anchorSize / 2,
          y: rect.top + rect.height / 2,
        };
      default:
        return { x: 0, y: 0 };
    }
  };


  // Anchor mouse down: start connection
  const handleAnchorMouseDown = (e, side) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = getAnchorPosition(side);
    setConnectingAnchor(side);
    onConnectionStart?.(node.id, side, pos);
  };

  // Anchor mouse up: end connection
  const handleAnchorMouseUp = (e, side) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingAnchor(null);
    const pos = getAnchorPosition(side);
    onConnectionEnd?.(node.id, side, pos);
  };

  // Anchor sizes
  const anchorSize = 12; // visible circle size
  const hitboxSize = 24; // hitbox area size

  const anchorBaseStyle =
    "absolute anchor-point bg-white border-2 border-blue-600 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity";

  const hitboxBaseStyle =
    "absolute anchor-hitbox cursor-pointer"; // used to enlarge clickable area

  // Toggle handler for CircuitSwitch
  const handleToggle = () => {
    const newIsOn = !isOn;
    if (onToggleSwitch) {
      onToggleSwitch(node.id, newIsOn);  // notify parent of toggle state change
    }
  };

  const [voltage, setVoltage] = useState(null);
  const [current, setCurrent] = useState(null);
  const [power, setPower] = useState(null);
  useEffect(() => {
    if (!node.id || !canvasId) return;

    let isMounted = true;
    let timeoutId;
    let intervalId;

    async function fetchNodeStatus() {
      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch(
          `http://localhost:5000/api/canvas/${canvasId}/nodes/${node.id}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch node status");
        const data = await response.json();

        if (isMounted) {
          setVoltage(data.voltage);
          setCurrent(data.current);
          setPower(data.power);
        }
      } catch (error) {
        console.error("Error fetching node status:", error);
        if (isMounted) {
          setVoltage(null);
          setCurrent(null);
          setPower(null);
        }
      }
    }

    // Delay the first fetch by 1 second (1000 ms)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchNodeStatus();

        // Then start polling every 1 second
        intervalId = setInterval(fetchNodeStatus, 1000);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [node.id, canvasId]);



  return (
  <div
    ref={nodeRef}
    className="absolute draggable-node group"
    onMouseDown={onMouseDown}
    style={{
      left: position.x,
      top: position.y,
      cursor: dragging ? "grabbing" : "grab",
      userSelect: dragging ? "none" : "auto",
      width: 140,
      height: 140,
    }}
  >
    {/* Node content */}
    <div
      className={classNames(
        "relative flex flex-col items-center gap-2 px-3 py-4 select-none rounded-2xl shadow-xl backdrop-blur-md",
        "border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/60 transition-all duration-300",
        selectedNodeId === node.id
          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
          : ""
      )}
    >
      {/* Anchor hitboxes & anchors */}

      {/* Top anchor */}
      <div
        onMouseDown={(e) => handleAnchorMouseDown(e, "top")}
        onMouseUp={(e) => handleAnchorMouseUp(e, "top")}
        className={hitboxBaseStyle}
        style={{
          width: hitboxSize,
          height: hitboxSize,
          top: -hitboxSize / 2,
          left: "50%",
          transform: "translateX(-50%)",
        }}
        title={t("Anchor Top")}
      >
        <div
          className={anchorBaseStyle}
          style={{
            width: anchorSize,
            height: anchorSize,
            top: (hitboxSize - anchorSize) / 2,
            left: (hitboxSize - anchorSize) / 2,
            position: "absolute",
          }}
        />
      </div>

      {/* Right anchor */}
      <div
        onMouseDown={(e) => handleAnchorMouseDown(e, "right")}
        onMouseUp={(e) => handleAnchorMouseUp(e, "right")}
        className={hitboxBaseStyle}
        style={{
          width: hitboxSize,
          height: hitboxSize,
          top: "50%",
          right: -hitboxSize / 2,
          transform: "translateY(-50%)",
        }}
        title={t("Anchor Right")}
      >
        <div
          className={anchorBaseStyle}
          style={{
            width: anchorSize,
            height: anchorSize,
            top: (hitboxSize - anchorSize) / 2,
            left: (hitboxSize - anchorSize) / 2,
            position: "absolute",
          }}
        />
      </div>

      {/* Bottom anchor */}
      <div
        onMouseDown={(e) => handleAnchorMouseDown(e, "bottom")}
        onMouseUp={(e) => handleAnchorMouseUp(e, "bottom")}
        className={hitboxBaseStyle}
        style={{
          width: hitboxSize,
          height: hitboxSize,
          bottom: -hitboxSize / 2,
          left: "50%",
          transform: "translateX(-50%)",
        }}
        title={t("Anchor Bottom")}
      >
        <div
          className={anchorBaseStyle}
          style={{
            width: anchorSize,
            height: anchorSize,
            top: (hitboxSize - anchorSize) / 2,
            left: (hitboxSize - anchorSize) / 2,
            position: "absolute",
          }}
        />
      </div>

      {/* Left anchor */}
      <div
        onMouseDown={(e) => handleAnchorMouseDown(e, "left")}
        onMouseUp={(e) => handleAnchorMouseUp(e, "left")}
        className={hitboxBaseStyle}
        style={{
          width: hitboxSize,
          height: hitboxSize,
          top: "50%",
          left: -hitboxSize / 2,
          transform: "translateY(-50%)",
        }}
        title={t("Anchor Left")}
      >
        <div
          className={anchorBaseStyle}
          style={{
            width: anchorSize,
            height: anchorSize,
            top: (hitboxSize - anchorSize) / 2,
            left: (hitboxSize - anchorSize) / 2,
            position: "absolute",
          }}
        />
      </div>

      {/* Circuit Switch + Top-Right Icons */}
      <div className="relative w-full">
        {/* Top-right icon group */}
        <div className="absolute z-10 flex flex-col items-center gap-1 top-1 right-1">
          {/* Lock/Unlock */}
          <button
            title={
              node.locked
                ? t("Unlock Switch")
                : t("Lock Switch")
            }
            className="p-1 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle?.(node.id, node.locked);
            }}
          >
            {node.locked ? (
              <Lock size={16} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <Unlock size={16} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Settings */}
          <button
            title={t("Configure")}
            className="p-1 bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure?.(node.id);
            }}
          >
            <Settings size={16} className="text-gray-700 dark:text-gray-300" />
          </button>

          {/* Delete */}
          <button
            title={t("Delete")}
            className="p-1 bg-red-600 rounded-full shadow-md hover:bg-red-700"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 size={16} className="text-white" />
          </button>
        </div>

        {/* Actual switch centered below icons */}
        <div className="flex justify-center">
          <CircuitSwitch
            isOn={isOn}
            size="md"
            label={node.switchName || node.address || t("Unnamed")}
            labelIsPlaceholder={!node.switchName && !!node.address}
            onToggle={handleToggle}
            disabled={node.locked}
          />
        </div>
      </div>

      {showDetails && (
        <div className="mt-1 text-xs text-center text-gray-600 dark:text-gray-300">
          <div>{t("Voltage")}: {voltage ?? t("N/A")} V</div>
          <div>{t("Current")}: {current ?? t("N/A")} A</div>
          <div>{t("Power")}: {power ?? t("N/A")} W</div>
        </div>
      )}
    </div>
  </div>
);

}

export default DraggableNode;