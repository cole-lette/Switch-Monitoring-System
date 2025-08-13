const express = require("express");
const router = express.Router();
const CanvasLayout = require("../model/CanvasLayout");
const authenticateJWT = require("../middleware/authenticateJWT");
const mqtt = require("mqtt");
const { subscribeToNode } = require("../mqttHelpers");


const requireAuth = authenticateJWT;

// Save a specific canvas by canvasId
router.post("/save", requireAuth, async (req, res) => {
  const { canvasId, nodes, positions, connections, scale, translate, canvasName } = req.body;
  const email = req.user.email;

  if (!email || !canvasId || !nodes || !positions || !connections) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Find the old canvas to compare nodes
    const oldCanvas = await CanvasLayout.findOne({ email, canvasId });
    const oldNodes = oldCanvas ? oldCanvas.nodes : [];

    // Find new nodes that don't exist in old nodes by matching address (or id)
    const newNodes = nodes.filter(
      (newNode) => !oldNodes.some((oldNode) => oldNode.address === newNode.address)
    );

    // Save/update the canvas document
    const saved = await CanvasLayout.findOneAndUpdate(
      { email, canvasId },
      {
        canvasName,
        nodes,
        positions,
        connections,
        scale,
        translate,
        lastSaved: new Date(),
      },
      { upsert: true, new: true }
    );

    // Subscribe to MQTT for each new node found
    for (const node of newNodes) {
      if (node.address && node.brokerUrl) {
        await subscribeToNode({
          ...node,
          canvasId,
          email,
        });
      }
    }

    res.json(saved);
  } catch (err) {
    console.error("Canvas save error:", err);
    res.status(500).json({ error: err.message });
  }
});



// Load a specific canvas by canvasId
router.get("/load/:canvasId", requireAuth, async (req, res) => {
  const email = req.user.email;
  const { canvasId } = req.params;

  try {
    const layout = await CanvasLayout.findOne({ email, canvasId });
    if (!layout) return res.status(404).json({ message: "No layout found" });
    res.json(layout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/load", requireAuth, async (req, res) => {
  const email = req.user.email;

  try {
    const layout = await CanvasLayout.findOne({ email });
    if (!layout) return res.status(404).json({ message: "No layout found" });
    res.json(layout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/canvas/list
router.get("/list", requireAuth, async (req, res) => {
  const email = req.user.email;
  try {
    const canvases = await CanvasLayout.find({ email }).select("canvasId canvasName lastSaved").lean();
    res.json(canvases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/canvas/:canvasId
router.delete("/:canvasId", requireAuth, async (req, res) => {
  const email = req.user.email;
  const { canvasId } = req.params;

  if (!canvasId) {
    return res.status(400).json({ error: "Missing canvasId" });
  }

  try {
    const deleted = await CanvasLayout.findOneAndDelete({ email, canvasId });
    if (!deleted) {
      return res.status(404).json({ message: "Canvas not found or already deleted" });
    }
    res.json({ message: "Canvas deleted", canvasId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/canvas/nodes/:id
router.put("/nodes/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const email = req.user.email;

  try {
    console.log("Updating node", id, "with", updates);

    const updated = await CanvasLayout.findOneAndUpdate(
      { email, "nodes.id": id },
      {
        $set: Object.fromEntries(
          Object.entries(updates).map(([k, v]) => [`nodes.$.${k}`, v])
        ),
        $currentDate: { lastSaved: true },
      },
      { new: true }
    );

    if (!updated) {
      console.log("No document updated");
      return res.status(404).json({ error: "Node not found" });
    }

    const updatedNode = updated.nodes.find(n => n.id === id);
    console.log("Updated node:", updatedNode);

    res.json(updatedNode);
  } catch (err) {
    console.error("PUT /canvas/nodes/:id error:", err.message);
    res.status(500).json({ error: "Failed to update node" });
  }
});



// Example GET /api/nodes to return all nodes for the authenticated user
router.get('/nodes', requireAuth, async (req, res) => {
  const email = req.user.email;
  try {
    // Replace this with your actual DB query for nodes related to this user
    const nodes = await Node.find({ email });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/canvas/rename/:canvasId
router.put("/rename/:canvasId", requireAuth, async (req, res) => {
  const { canvasId } = req.params;
  const { canvasName } = req.body;
  const email = req.user.email;

  if (!canvasName || !canvasId) {
    return res.status(400).json({ error: "Missing name or canvasId" });
  }

  try {
    const updated = await CanvasLayout.findOneAndUpdate(
      { email, canvasId },
      { canvasName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Canvas not found" });
    }

    res.json({ message: "Canvas renamed successfully", canvasId, canvasName });
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ error: "Failed to rename canvas" });
  }
});

router.get("/:canvasId/nodes-with-devices", requireAuth, async (req, res) => {
  const email = req.user.email;
  const { canvasId } = req.params;

  try {
    const layout = await CanvasLayout.findOne({ email, canvasId });
    if (!layout) {
      return res.status(404).json({ message: "Canvas not found" });
    }

    // Just return the nodes as they are stored in the canvas
    res.json({ nodes: layout.nodes });

  } catch (err) {
    console.error("Error loading nodes:", err);
    res.status(500).json({ error: "Failed to load nodes" });
  }
});

// GET /api/canvas/:canvasId/nodes/:nodeId/status
router.get("/:canvasId/nodes/:nodeId/status", requireAuth, async (req, res) => {
  const email = req.user.email;
  const { canvasId, nodeId } = req.params;

  try {
    // Find the canvas by canvasId and email
    const layout = await CanvasLayout.findOne({ email, canvasId });
    if (!layout) return res.status(404).json({ message: "Canvas not found" });

    // Find the node within the canvas nodes array
    const node = layout.nodes.find(n => n.id === nodeId);
    if (!node) return res.status(404).json({ message: "Node not found" });

    // Return the status for that node
    res.json({
      id: node.id,
      voltage: node.voltageReading,
      current: node.amperageReading,
      power: node.active_power,
    });
  } catch (err) {
    console.error("Error fetching node status:", err);
    res.status(500).json({ message: "Failed to fetch node status" });
  }
});

// GET /api/canvas/all-nodes-with-devices
router.get("/all-nodes-with-devices", requireAuth, async (req, res) => {
  const email = req.user.email;

  try {
    const layouts = await CanvasLayout.find({ email });

    // Instead of mapping with mapBackendNodeToFrontend, just return raw nodes with canvasId
    const allNodes = layouts.flatMap(layout =>
      layout.nodes.map(node => ({
        ...node.toObject ? node.toObject() : node, // Ensure plain object, in case node is a Mongoose doc
        canvasId: layout.canvasId,
      }))
    );

    res.json({ nodes: allNodes });
  } catch (err) {
    console.error("Error fetching all nodes with devices:", err);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});

// routes/canvas.js
router.patch("/:canvasId/nodes/:nodeId/lock", requireAuth, async (req, res) => {
  const { canvasId, nodeId } = req.params;
  const { locked } = req.body;
  const email = req.user.email;

  try {
    const canvas = await CanvasLayout.findOne({ email, canvasId });
    if (!canvas) return res.status(404).json({ error: "Canvas not found" });

    const node = canvas.nodes.find(n => n.id === nodeId);
    if (!node) return res.status(404).json({ error: "Node not found" });

    node.locked = locked;
    await canvas.save();

    res.json(node);
  } catch (err) {
    console.error("Error updating node lock status:", err);
    res.status(500).json({ error: "Failed to update node lock status" });
  }
});


module.exports = router;