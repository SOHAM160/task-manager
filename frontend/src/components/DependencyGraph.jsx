import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../utils/api";

/**
 * DependencyGraph — Interactive DAG visualization with Critical Path.
 * Uses SVG for rendering nodes & edges with force-directed layout.
 */
export default function DependencyGraph({ tasks, workspaceId, onRefreshTasks }) {
  const [graphData, setGraphData] = useState(null);
  const [criticalData, setCriticalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCritical, setShowCritical] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [addingDep, setAddingDep] = useState(null); // taskId currently linking from
  const svgRef = useRef(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (workspaceId) params.workspaceId = workspaceId;
      const res = await api.get("/api/dependencies/graph", { params });
      setGraphData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load graph");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const fetchCriticalPath = useCallback(async () => {
    try {
      const params = {};
      if (workspaceId) params.workspaceId = workspaceId;
      const res = await api.get("/api/dependencies/critical-path", { params });
      setCriticalData(res.data);
      setShowCritical(true);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to compute critical path");
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph, tasks]);

  const addDependency = async (taskId, dependsOnId) => {
    try {
      await api.post("/api/dependencies/add", {
        taskId,
        dependsOnId,
        workspaceId: workspaceId || undefined,
      });
      setAddingDep(null);
      fetchGraph();
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add dependency");
    }
  };

  const removeDependency = async (taskId, dependsOnId) => {
    try {
      await api.post("/api/dependencies/remove", { taskId, dependsOnId });
      fetchGraph();
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove dependency");
    }
  };

  // Layout computation — layered DAG placement
  const layout = useMemo(() => {
    if (!graphData || !graphData.nodes.length) return { nodes: [], edges: [] };

    const { nodes, edges } = graphData;
    const nodeMap = new Map();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Compute layers using longest path from roots
    const inDegree = new Map();
    const children = new Map();
    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      children.set(n.id, []);
    });

    edges.forEach((e) => {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      if (children.has(e.from)) {
        children.get(e.from).push(e.to);
      }
    });

    // BFS layering
    const layer = new Map();
    const queue = [];
    nodes.forEach((n) => {
      if (inDegree.get(n.id) === 0) {
        layer.set(n.id, 0);
        queue.push(n.id);
      }
    });

    // For nodes with no deps and not connected, put them at layer 0
    nodes.forEach((n) => {
      if (!layer.has(n.id) && (n.dependsOn || []).length === 0) {
        layer.set(n.id, 0);
        queue.push(n.id);
      }
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      const currLayer = layer.get(curr) || 0;
      const kids = children.get(curr) || [];
      for (const kid of kids) {
        const newLayer = currLayer + 1;
        if (!layer.has(kid) || layer.get(kid) < newLayer) {
          layer.set(kid, newLayer);
        }
        inDegree.set(kid, inDegree.get(kid) - 1);
        if (inDegree.get(kid) === 0) {
          queue.push(kid);
        }
      }
    }

    // Assign remaining unvisited nodes (cycle members or disconnected)
    nodes.forEach((n) => {
      if (!layer.has(n.id)) layer.set(n.id, 0);
    });

    // Group by layer
    const layers = new Map();
    nodes.forEach((n) => {
      const l = layer.get(n.id) || 0;
      if (!layers.has(l)) layers.set(l, []);
      layers.get(l).push(n.id);
    });

    const nodeWidth = 180;
    const nodeHeight = 50;
    const horizontalGap = 240;
    const verticalGap = 80;

    const positions = new Map();
    const sortedLayers = [...layers.keys()].sort((a, b) => a - b);

    sortedLayers.forEach((l, layerIdx) => {
      const layerNodes = layers.get(l);
      const layerHeight = layerNodes.length * (nodeHeight + verticalGap);
      const startY = -layerHeight / 2 + nodeHeight / 2;

      layerNodes.forEach((id, idx) => {
        positions.set(id, {
          x: layerIdx * horizontalGap + 40,
          y: startY + idx * (nodeHeight + verticalGap) + 200,
        });
      });
    });

    // Total dimensions
    const maxLayer = sortedLayers.length;
    const maxNodesInLayer = Math.max(
      ...sortedLayers.map((l) => layers.get(l).length)
    );
    const totalWidth = Math.max(maxLayer * horizontalGap + nodeWidth + 80, 600);
    const totalHeight = Math.max(
      maxNodesInLayer * (nodeHeight + verticalGap) + 200,
      400
    );

    // Adjust Y positions to be positive
    let minY = Infinity;
    positions.forEach((pos) => {
      if (pos.y < minY) minY = pos.y;
    });
    if (minY < 40) {
      const offset = 40 - minY;
      positions.forEach((pos) => {
        pos.y += offset;
      });
    }

    const criticalSet = new Set();
    if (showCritical && criticalData) {
      criticalData.criticalPath.forEach((cp) => criticalSet.add(cp.id));
    }

    const layoutNodes = nodes.map((n) => ({
      ...n,
      pos: positions.get(n.id) || { x: 0, y: 0 },
      isCritical: criticalSet.has(n.id),
    }));

    const layoutEdges = edges
      .filter(
        (e) => positions.has(e.from) && positions.has(e.to)
      )
      .map((e) => ({
        ...e,
        fromPos: positions.get(e.from),
        toPos: positions.get(e.to),
        isCritical:
          criticalSet.has(e.from) && criticalSet.has(e.to),
      }));

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      width: totalWidth,
      height: totalHeight + 40,
    };
  }, [graphData, showCritical, criticalData]);

  const getNodeColor = (node) => {
    if (node.isCritical && showCritical) return "#ef4444";
    if (node.blocked) return "#6b7280";
    if (node.completed || node.status === "DONE") return "#10b981";
    if (node.status === "IN_PROGRESS") return "#3b82f6";
    return "#f97316";
  };

  const getNodeBorder = (node) => {
    if (node.isCritical && showCritical) return "#fca5a5";
    if (node.blocked) return "#cbd5e1";
    if (node.completed || node.status === "DONE") return "#a7f3d0";
    if (node.status === "IN_PROGRESS") return "#bfdbfe";
    return "#fed7aa";
  };

  if (isLoading && !graphData) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          Loading dependency graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#ef4444" }}>
          {error}
        </div>
      </div>
    );
  }

  const hasEdges = graphData && graphData.edges.length > 0;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "4px",
              color: "#1e3a8a",
            }}
          >
            Task Dependency Graph
          </h2>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            {graphData
              ? `${graphData.nodes.length} tasks • ${graphData.edges.length} dependencies`
              : ""}
            {graphData?.hasCycle && (
              <span style={{ color: "#dc2626", marginLeft: "12px", fontWeight: "600" }}>
                Cycle detected!
              </span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {addingDep && (
            <button
              onClick={() => setAddingDep(null)}
              style={{
                ...btnStyle,
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
              }}
            >
              Cancel Link
            </button>
          )}
          <button
            onClick={fetchCriticalPath}
            disabled={!hasEdges}
            style={{
              ...btnStyle,
              background: showCritical
                ? "#fee2e2"
                : "#fef2f2",
              color: "#b91c1c",
              border: `1px solid ${showCritical ? "#f87171" : "#fca5a5"}`,
              opacity: hasEdges ? 1 : 0.4,
              cursor: hasEdges ? "pointer" : "not-allowed",
            }}
          >
            {showCritical ? "Update" : "Show"} Critical Path
          </button>
          <button
            onClick={() => {
              setShowCritical(false);
              setCriticalData(null);
            }}
            disabled={!showCritical}
            style={{
              ...btnStyle,
              background: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              opacity: showCritical ? 1 : 0.4,
            }}
          >
            Hide Critical
          </button>
          <button
            onClick={fetchGraph}
            style={{
              ...btnStyle,
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { color: "#f97316", label: "To Do" },
          { color: "#3b82f6", label: "In Progress" },
          { color: "#10b981", label: "Done" },
          { color: "#6b7280", label: "Blocked" },
          { color: "#ef4444", label: "Critical Path" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: item.color,
              }}
            />
            <span style={{ fontSize: "11px", color: "#475569" }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "20px", height: "2px", background: "#ef4444" }} />
          <span style={{ fontSize: "11px", color: "#475569" }}>Critical Edge</span>
        </div>
      </div>

      {/* Critical Path Summary */}
      {showCritical && criticalData && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#991b1b", marginBottom: "6px" }}>
            Critical Path — {criticalData.totalDuration}h total project time
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            {criticalData.criticalPath.map((cp, idx) => (
              <span key={cp.id}>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#991b1b",
                    background: "#fecaca",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid #fca5a5",
                  }}
                >
                  {cp.title}
                </span>
                {idx < criticalData.criticalPath.length - 1 && (
                  <span style={{ color: "#ef4444", margin: "0 4px" }}>&rarr;</span>
                )}
              </span>
            ))}
          </div>
          {criticalData.schedule && (
            <div style={{ marginTop: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr>
                    {["Task", "Est.", "ES", "EF", "LS", "LF", "Slack", "Critical"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #fee2e2",
                          color: "#475569",
                          textAlign: "left",
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criticalData.schedule.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        background: s.isCritical ? "#fff5f5" : "transparent",
                      }}
                    >
                      <td style={tdStyle}>{s.title}</td>
                      <td style={tdStyle}>{s.estimatedTime}h</td>
                      <td style={tdStyle}>{s.ES}</td>
                      <td style={tdStyle}>{s.EF}</td>
                      <td style={tdStyle}>{s.LS}</td>
                      <td style={tdStyle}>{s.LF}</td>
                      <td style={{ ...tdStyle, color: s.slack === 0 ? "#ef4444" : "#16a34a" }}>
                        {s.slack}
                      </td>
                      <td style={tdStyle}>
                        {s.isCritical ? (
                          <span style={{ color: "#ef4444" }}>●</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>○</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SVG Graph */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "500px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#f8fafc",
        }}
      >
        {layout.nodes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            No tasks to display. Create some tasks first.
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={layout.width}
            height={layout.height}
            style={{ minWidth: "100%" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
                fill="#94a3b8"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
              <marker
                id="arrowhead-critical"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
                fill="#ef4444"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
            </defs>

            {/* Edges */}
            {layout.edges.map((edge, i) => {
              const fromX = edge.fromPos.x + 180;
              const fromY = edge.fromPos.y + 25;
              const toX = edge.toPos.x;
              const toY = edge.toPos.y + 25;
              const midX = (fromX + toX) / 2;

              return (
                <g key={`edge-${i}`}>
                  <path
                    d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                    fill="none"
                    stroke={edge.isCritical ? "#ef4444" : "#cbd5e1"}
                    strokeWidth={edge.isCritical ? 2.5 : 1.5}
                    strokeDasharray={edge.isCritical ? "" : "6,3"}
                    markerEnd={
                      edge.isCritical
                        ? "url(#arrowhead-critical)"
                        : "url(#arrowhead)"
                    }
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const x = node.pos.x;
              const y = node.pos.y;
              const bgColor = getNodeColor(node);
              const borderColor = getNodeBorder(node);
              const isSelected = selectedNode === node.id;
              const isLinkTarget = addingDep && addingDep !== node.id;

              return (
                <g
                  key={node.id}
                  style={{ cursor: isLinkTarget ? "crosshair" : "pointer" }}
                  onClick={() => {
                    if (addingDep && addingDep !== node.id) {
                      addDependency(addingDep, node.id);
                    } else {
                      setSelectedNode(isSelected ? null : node.id);
                    }
                  }}
                >
                  {/* Node background */}
                  <rect
                    x={x}
                    y={y}
                    width={180}
                    height={50}
                    rx={6}
                    ry={6}
                    fill="#ffffff"
                    stroke={isSelected ? "#3b82f6" : borderColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Status indicator */}
                  <circle cx={x + 14} cy={y + 25} r={5} fill={bgColor} />

                  {/* Title */}
                  <text
                    x={x + 26}
                    y={y + 21}
                    fill="#0f172a"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                  >
                    {node.title.length > 16
                      ? node.title.slice(0, 16) + "…"
                      : node.title}
                  </text>

                  {/* Status label */}
                  <text
                    x={x + 26}
                    y={y + 37}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="system-ui, sans-serif"
                  >
                    {node.blocked
                      ? "Blocked"
                      : node.status.replace("_", " ")}
                    {node.estimatedTime > 0 && ` • ${node.estimatedTime}h`}
                  </text>

                  {/* Link mode highlight */}
                  {isLinkTarget && (
                    <rect
                      x={x - 2}
                      y={y - 2}
                      width={184}
                      height={54}
                      rx={8}
                      ry={8}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                      opacity={0.6}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && graphData && (
        <div
          style={{
            marginTop: "16px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          {(() => {
            const node = graphData.nodes.find((n) => n.id === selectedNode);
            if (!node) return null;

            return (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {node.title}
                  </h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setAddingDep(node.id)}
                      style={{
                        ...btnStyle,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        fontSize: "11px",
                      }}
                    >
                      Add Prerequisite
                    </button>
                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{ ...btnStyle, background: "transparent", color: "#64748b", border: "none" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>
                    Status: <strong style={{ color: getNodeColor(node) }}>{node.status}</strong>
                  </span>
                  <span style={{ color: "#475569" }}>
                    Prerequisite Hours: <strong style={{ color: "#0f172a" }}>{node.estimatedTime}h</strong>
                  </span>
                  {node.blocked && (
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>Blocked</span>
                  )}
                </div>

                {node.dependsOn.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Depends On:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {node.dependsOn.map((depId) => {
                        const depNode = graphData.nodes.find((n) => n.id === depId);
                        return (
                          <div
                            key={depId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "#ffffff",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: depNode?.completed ? "#10b981" : "#f97316",
                              }}
                            />
                            <span style={{ fontSize: "12px", color: "#0f172a" }}>
                              {depNode?.title || depId}
                            </span>
                            <button
                              onClick={() => removeDependency(node.id, depId)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "12px",
                                padding: "0 2px",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show who depends on this task */}
                {(() => {
                  const dependents = graphData.nodes.filter((n) =>
                    n.dependsOn.includes(node.id)
                  );
                  if (dependents.length === 0) return null;
                  return (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Blocks:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {dependents.map((d) => (
                          <span
                            key={d.id}
                            style={{
                              fontSize: "12px",
                              color: "#d97706",
                              background: "#fef3c7",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #fde68a",
                            }}
                          >
                            {d.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </div>
      )}

      {/* Link mode indicator */}
      {addingDep && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px 16px",
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#6d28d9" }}>
            <strong>Link Mode:</strong> Click on a task node that "
            {graphData?.nodes.find((n) => n.id === addingDep)?.title}" depends
            on (a prerequisite).
          </span>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  background: "#ffffff",
  color: "#0f172a",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  margin: "32px auto 0",
  maxWidth: "960px",
};

const btnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
  border: "none",
};

const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
};
