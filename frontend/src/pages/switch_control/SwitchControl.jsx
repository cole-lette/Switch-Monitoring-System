import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Palette from "./components/Palette";
import MiniMap from "./components/MiniMap";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DraggableNode from './components/DraggableNode';
import SettingsModal from "./components/SettingsModal";
import Arrows from "./components/Arrows"
import UndoRedoControls from "./components/UndoRedoControls";
import ZoomControls from "./components/ZoomControls";
import CanvasControls from "./components/CanvasControls";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";


export default function SwitchControl() {
  const { t } = useTranslation();
  const location = useLocation();
  const canvasRef = useRef(null);

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const [nodes, setNodes] = useState([]);
  const [positions, setPositions] = useState({});
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Connection-related state
  const [connections, setConnections] = useState([]); // { fromNodeId, fromAnchor, toNodeId, toAnchor }
  const [connectionInProgress, setConnectionInProgress] = useState(null); // { fromNodeId, fromAnchor, fromPos: {x,y}, toPos: {x,y} }

  const [anchorPositions, setAnchorPositions] = useState({});

  const [canvasList, setCanvasList] = useState([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState(null);

  const [selectedNode, setSelectedNode] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCanvasName, setCurrentCanvasName] = useState("");

  const [showDetails, setShowDetails] = useState(false);


  const onCanvasUpdated = () => {
    fetch("http://localhost:5000/api/canvas/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCanvasList(data));
  };
  const getEmailFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.email || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };


  const handleReportAnchors = (nodeId, anchors) => {
    setAnchorPositions((prev) => ({ ...prev, [nodeId]: anchors }));
  };

  // Save sidebar collapsed state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  // Handle resizing canvas container
  useEffect(() => {
    if (!canvasRef.current) return;
    const r = () => {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // Undo / Redo keyboard shortcuts and Zoom on Ctrl + wheel
  useEffect(() => {
    const keydownHandler = (e) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === "Delete") && selectedNode) {
        e.preventDefault();
        handleDelete(selectedNode);
        setSelectedNode(null);
      }
      else if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // You may want to call a save function here
        document.querySelector("[data-canvas-save='true']")?.click();
      }
    };

    const wheelHandler = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else if (e.deltaY > 0) {
          handleZoomOut();
        }
      }
    };

    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("wheel", wheelHandler);
    };
  }, [history, future, scale, selectedNode]);


  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        positions: JSON.parse(JSON.stringify(positions)),
        connections: JSON.parse(JSON.stringify(connections)),
      },
    ]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setFuture((f) => [
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        positions: JSON.parse(JSON.stringify(positions)),
        connections: JSON.parse(JSON.stringify(connections)),
      },
      ...f,
    ]);
    setNodes(last.nodes);
    setPositions(last.positions);
    setConnections(last.connections || []);
    setHistory((h) => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [
      ...h,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        positions: JSON.parse(JSON.stringify(positions)),
        connections: JSON.parse(JSON.stringify(connections)),
      },
    ]);
    setNodes(next.nodes);
    setPositions(next.positions);
    setConnections(next.connections || []);
    setFuture((f) => f.slice(1));
  };

  const handleDragStart = () => {
    saveHistory();
  };

  const handleNodeDrag = (id, x, y) => {
    setPositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const handleDelete = (id) => {
    saveHistory();
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setPositions((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setConnections((prev) => prev.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/reactflow");
    if (!dataStr) return;

    let deviceData;
    try {
      deviceData = JSON.parse(dataStr);
    } catch {
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - canvasRect.left - translate.x) / scale;
    const y = (e.clientY - canvasRect.top - translate.y) / scale;

    const id = Date.now().toString();

    const name = deviceData.address
      ? `${deviceData.address}`
      : `${deviceData.type || "Node"} ${nodes.length + 1}`;

    const newNode = {
      id,
      name,
      ...deviceData,
    };

    saveHistory();

    const updatedNodes = [...nodes, newNode];
    const updatedPositions = { ...positions, [id]: { x, y } };

    setNodes(updatedNodes);
    setPositions(updatedPositions);

    if (selectedCanvasId === "new") {
      // New canvas: do NOT save automatically
      toast.info("Node added. Please save and name your canvas.");
      // Optionally open a "Save Canvas" modal here, if you have one
      return;
    }

    // Existing canvas: save automatically with existing canvas name
    try {
      await saveCanvas(selectedCanvasId, currentCanvasName, updatedNodes, updatedPositions, connections, scale, translate);
    } catch (err) {
      console.error(err);
    }
  };


  const saveCanvas = async (
    canvasIdToUse,
    canvasName = "",
    nodesToSave = nodes,
    positionsToSave = positions,
    connectionsToSave = connections,
    scaleToSave = scale,
    translateToSave = translate
  ) => {
    setIsSaving(true);
    try {
      const payload = {
        canvasId: canvasIdToUse,
        canvasName: canvasName,
        nodes: nodesToSave,
        positions: positionsToSave,
        connections: connectionsToSave,
        scale: scaleToSave,
        translate: {
          x: translateToSave?.x ?? 0,
          y: translateToSave?.y ?? 0,
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

      toast.success("Switch Placed, Canvas Saved!");
      setSelectedCanvasId(result.canvasId || canvasIdToUse);
      if (onCanvasUpdated) onCanvasUpdated();
      setModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving canvas");
      throw err; // rethrow so handleDrop knows
    } finally {
      setIsSaving(false);
    }
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const isClickOnNode = (element) => {
    while (element && element !== canvasRef.current) {
      if (element.classList && element.classList.contains("draggable-node")) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    if (isClickOnNode(e.target)) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // If dragging a connection, update preview endpoint
    if (connectionInProgress) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const toX = (e.clientX - canvasRect.left - translate.x) / scale;
      const toY = (e.clientY - canvasRect.top - translate.y) / scale;

      setConnectionInProgress((prev) => prev ? { ...prev, toPos: { x: toX, y: toY } } : null);
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);

    // If dragging connection ended outside anchor, cancel it
    if (connectionInProgress) {
      setConnectionInProgress(null);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  const handleNavigate = ({ x, y }) => {
    setTranslate({ x, y });
  };

  const handleOpenSettings = (nodeId) => {
    console.log("handleOpenSettings called with", nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setSelectedDevice(node);
    setSettingsVisible(true);
  };


  const handleCloseSettings = () => {
    setSelectedDevice(null);
    setSettingsVisible(false);
  };

  // Connection Handlers passed down to DraggableNode:

  // Called when user starts dragging a connection from a node anchor
  const onConnectionStart = (fromNodeId, fromAnchor, fromPos) => {
    setConnectionInProgress({
      fromNodeId,
      fromAnchor,
      fromPos: {
        x: (fromPos.x - canvasRef.current.getBoundingClientRect().left - translate.x) / scale,
        y: (fromPos.y - canvasRef.current.getBoundingClientRect().top - translate.y) / scale,
      },
      toPos: {
        x: (fromPos.x - canvasRef.current.getBoundingClientRect().left - translate.x) / scale,
        y: (fromPos.y - canvasRef.current.getBoundingClientRect().top - translate.y) / scale,
      }
    });
  };

  // Called on mouse move during connection drag - handled via handleMouseMove already
  // Called when user ends dragging connection on an anchor
  const onConnectionEnd = (toNodeId, toAnchor, toPos) => {
    if (!connectionInProgress) return;

    if (
      toNodeId &&
      toAnchor &&
      !(connectionInProgress.fromNodeId === toNodeId && connectionInProgress.fromAnchor === toAnchor)
    ) {
      const exists = connections.some(
        (conn) =>
          conn.fromNodeId === connectionInProgress.fromNodeId &&
          conn.fromAnchor === connectionInProgress.fromAnchor &&
          conn.toNodeId === toNodeId &&
          conn.toAnchor === toAnchor
      );
      if (exists) {
        setConnectionInProgress(null);
        return; // prevent duplicate
      }

      saveHistory();
      setConnections((prev) => [
        ...prev,
        {
          fromNodeId: connectionInProgress.fromNodeId,
          fromAnchor: connectionInProgress.fromAnchor,
          toNodeId,
          toAnchor,
          color: "black",
          lineStyle: "solid",
          arrowHead: "default",
          lineType: "bezier",
        },
      ]);
    }
    setConnectionInProgress(null);
  };

  // Remove connection helper
  const handleRemoveConnection = (index) => {
    saveHistory();
    setConnections((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to get position of an anchor for a node (same logic as DraggableNode's getAnchorPosition)
  const getAnchorCanvasPosition = (nodeId, anchor) => {
    if (anchorPositions[nodeId]?.[anchor]) {
      return anchorPositions[nodeId][anchor];
    }
    // fallback to fixed positions:
    const pos = positions[nodeId];
    if (!pos) return { x: 0, y: 0 };

    switch (anchor) {
      case "top":
        return { x: pos.x + 140 / 2, y: pos.y };
      case "right":
        return { x: pos.x + 140, y: pos.y + 160 / 2 };
      case "bottom":
        return { x: pos.x + 140 / 2, y: pos.y + 140 };
      case "left":
        return { x: pos.x, y: pos.y + 160 / 2 };
      default:
        return pos;
    }
  };

  // Helper to create SVG path for a curved connection line between two points
  function createConnectionPath(start, end, fromAnchor, toAnchor, lineType = "bezier") {
    if (lineType === "bezier") {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.min(Math.max(dist * 0.3, 20), 40);

      let c1x = start.x, c1y = start.y, c2x = end.x, c2y = end.y;

      switch (fromAnchor) {
        case "top": c1y -= offset; break;
        case "bottom": c1y += offset; break;
        case "left": c1x -= offset; break;
        case "right": c1x += offset; break;
      }
      switch (toAnchor) {
        case "top": c2y -= offset; break;
        case "bottom": c2y += offset; break;
        case "left": c2x -= offset; break;
        case "right": c2x += offset; break;
      }

      return `M${start.x},${start.y} C${c1x},${c1y} ${c2x},${c2y} ${end.x},${end.y}`;
    }
    else if (lineType === "orthogonal") {

      let midX, midY;

      const horizontalAnchors = ["left", "right"];
      const verticalAnchors = ["top", "bottom"];

      if (horizontalAnchors.includes(fromAnchor)) {
        // horizontal first
        midX = (start.x + end.x) / 2;
        return `M${start.x},${start.y} L${midX},${start.y} L${midX},${end.y} L${end.x},${end.y}`;
      } else if (verticalAnchors.includes(fromAnchor)) {
        // vertical first
        midY = (start.y + end.y) / 2;
        return `M${start.x},${start.y} L${start.x},${midY} L${end.x},${midY} L${end.x},${end.y}`;
      }

      // fallback straight line
      return `M${start.x},${start.y} L${end.x},${end.y}`;
    }

    // Default fallback
    return `M${start.x},${start.y} L${end.x},${end.y}`;
  }


  // Devices for palette
  const yourPlacedDevicesArray = nodes.map(({ address, brokerUrl, id, part_number, hw_version, sw_version }) => ({
    address,
    brokerUrl,
    id,
    part_number,
    hw_version,
    sw_version,
  }));



  const handleSaveSettings = async (updatedNode) => {
    try {
      const response = await fetch(`http://localhost:5000/api/canvas/nodes/${selectedDevice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(updatedNode), // send all updated fields here
      });

      if (!response.ok) {
        throw new Error("Failed to save node settings");
      }

      const savedNode = await response.json();

      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedDevice.id ? { ...node, ...savedNode } : node
        )
      );
      setSettingsVisible(false);
      setSelectedDevice(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save device settings. Please try again.");
    }
  };

  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);



  const handleToggleSwitch = async (nodeId, newIsOn) => {
    const token = localStorage.getItem("authToken");
    const email = getEmailFromToken();

    try {
      // Optimistically update UI first
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, isOn: newIsOn } : node
        )
      );

      // Send update to backend
      const response = await fetch(`http://localhost:5000/api/canvas/nodes/${nodeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOn: newIsOn }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update node ${nodeId}`);
      }

      // Use the latest nodes from the ref here:
      const toggledNode = nodesRef.current.find((node) => node.id === nodeId);

      if (toggledNode) {
        await fetch("http://localhost:5000/api/logs/switch-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            brokerUrl: toggledNode.brokerUrl,
            address: toggledNode.address,
            switchName: toggledNode.switchName || "Undefined",
            isOn: newIsOn,
            health_status: toggledNode.health_status || "OK",
          }),
        });
      }

    } catch (error) {
      console.error(error);
      alert("Failed to save toggle state. Please try again.");

      // Revert UI update on error
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, isOn: !newIsOn } : node
        )
      );
    }
  };


  useEffect(() => {
    if (!selectedCanvasId) return;

    if (selectedCanvasId === "new") {
      // Clear everything for a new canvas
      setNodes([]);
      setPositions({});
      setConnections([]);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      return;
    }

    fetch(`http://localhost:5000/api/canvas/load/${selectedCanvasId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setNodes(data.nodes || []);
        setPositions(data.positions || {});
        setConnections(data.connections || []);
        setScale(data.scale || 1);
        setTranslate(data.translate || { x: 0, y: 0 });
        setCurrentCanvasName(data.canvasName || "");
      })
      .catch((err) => {
        console.error("Error loading canvas:", err);
      });
  }, [selectedCanvasId]);

  useEffect(() => {
    fetch("http://localhost:5000/api/canvas/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCanvasList(data);
        if (data.length > 0 && !selectedCanvasId) {
          setSelectedCanvasId(data[0].canvasId);
        }
      })
      .catch((err) => {
        console.error("Error fetching canvas list:", err);
      });
  }, []);

  const handleLockToggle = async (nodeId, currentLockStatus) => {
    try {
      const newLockStatus = !currentLockStatus;

      // update local state immediately (for instant feedback)
      setNodes(prev =>
        prev.map(n =>
          n.id === nodeId ? { ...n, locked: newLockStatus } : n
        )
      );

      // send to backend
      await fetch(`http://localhost:5000/api/canvas/${selectedCanvasId}/nodes/${nodeId}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ locked: newLockStatus }),
      });
    } catch (err) {
      console.error("Failed to update lock status", err);
      toast.error("Failed to update lock status.");
    }
  };



  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} activePath={location.pathname} />

      <main
        className={`flex-1 transition-[margin-left] duration-300 ease-in-out text-gray-800 dark:text-gray-200 ${collapsed ? "ml-[60px]" : "ml-[220px]"
          }`}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <div className="flex flex-col h-full p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("Switch Control - Builder")}
            </h1>
            <div className="flex gap-2">
              <CanvasControls
                selectedCanvasId={selectedCanvasId}
                setSelectedCanvasId={setSelectedCanvasId}
                canvasList={canvasList}
                nodes={nodes}
                positions={positions}
                onRename={(newName) => setCurrentCanvasName(newName)}
                currentCanvasName={currentCanvasName}
                setCurrentCanvasName={setCurrentCanvasName}
                connections={connections}
                scale={scale}
                onCanvasUpdated={onCanvasUpdated}
                translate={translate}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                t={t}
              />

              <UndoRedoControls
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={history.length > 0}
                canRedo={future.length > 0}
                t={t}
              />
              <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} t={t} />
            </div>

          </div>

          {/* Content Row */}
          <div className="flex flex-1 min-h-0 gap-6">
            {/* Sidebar column */}
            <div
              className="flex flex-col items-center gap-4"
              style={{ width: 220, minHeight: 0, height: "100%" }}
            >
              <div
                style={{ flexGrow: 1, width: "100%", overflowY: "auto", minHeight: 0, overflow: 'hidden' }}
              >
                <Palette placedDevices={yourPlacedDevicesArray} onDragStart={handleDragStart} t={t} />
              </div>
              <div style={{ height: 120, flexShrink: 0, width: "100%" }}>
                <MiniMap
                  nodes={nodes}
                  positions={positions}
                  scale={scale}
                  translate={translate}
                  onNavigate={handleNavigate}
                  width={220}
                  height={120} // Match div height exactly
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  onClick={() => setSelectedArrowIndex(null)}
                  t={t}
                />
              </div>
            </div>

            {/* Canvas container */}
            <div
              ref={canvasRef}
              className="relative flex-1 overflow-hidden bg-white border rounded dark:bg-gray-800 cursor-grab"
              style={{ height: "100%" }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              t={t}
            >
              <div
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: "top left",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* SVG connections layer - behind nodes */}
                <Arrows
                  connections={connections}
                  connectionInProgress={connectionInProgress}
                  getAnchorCanvasPosition={getAnchorCanvasPosition}
                  createConnectionPath={createConnectionPath}
                  handleRemoveConnection={handleRemoveConnection}
                  setConnections={setConnections}
                  t={t}
                />

                {/* Nodes */}
                {nodes.map((node) => (
                  <DraggableNode
                    key={node.id}
                    node={node}
                    position={positions[node.id] || { x: 0, y: 0 }}
                    onDrag={handleNodeDrag}
                    onDelete={handleDelete}
                    onConfigure={handleOpenSettings}
                    canvasRef={canvasRef}
                    scale={scale}
                    isOn={node.isOn}
                    onToggleSwitch={handleToggleSwitch}
                    translate={translate}
                    onDragStart={handleDragStart}
                    onConnectionStart={onConnectionStart}
                    onReportAnchors={handleReportAnchors}
                    onSelect={setSelectedNode}
                    selectedNodeId={selectedNode}
                    onConnectionMove={(x, y) => {
                      setConnectionInProgress((prev) =>
                        prev ? { ...prev, toPos: { x: x / scale, y: y / scale } } : null
                      );
                    }}
                    onConnectionEnd={onConnectionEnd}
                    showDetails={showDetails}
                    canvasId={selectedCanvasId}
                    onLockToggle={handleLockToggle}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {settingsVisible && selectedDevice && (
          <SettingsModal
            node={selectedDevice}
            onClose={handleCloseSettings}
            onSave={handleSaveSettings}
            t={t}
          />
        )}

      </main>
    </div>
  );

}
