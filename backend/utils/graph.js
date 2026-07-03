/**
 * Graph algorithms for Task Dependency Management.
 * Implements: Topological Sort, Cycle Detection (DFS), Critical Path Method (CPM).
 */

/**
 * Detect cycles in the dependency graph using DFS.
 * @param {Map<string, string[]>} adjList - Adjacency list (taskId -> [dependsOn ids])
 * @param {string[]} allIds - All task IDs
 * @returns {{ hasCycle: boolean, cyclePath: string[] }}
 */
function detectCycle(adjList, allIds) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  const parent = new Map();

  allIds.forEach((id) => color.set(id, WHITE));

  let cyclePath = [];

  function dfs(u) {
    color.set(u, GRAY);
    const neighbors = adjList.get(u) || [];

    for (const v of neighbors) {
      if (color.get(v) === GRAY) {
        // Found a cycle — reconstruct path
        cyclePath = [v, u];
        let curr = u;
        while (parent.has(curr) && parent.get(curr) !== v) {
          curr = parent.get(curr);
          cyclePath.push(curr);
        }
        cyclePath.reverse();
        return true;
      }
      if (color.get(v) === WHITE) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }

    color.set(u, BLACK);
    return false;
  }

  for (const id of allIds) {
    if (color.get(id) === WHITE) {
      if (dfs(id)) return { hasCycle: true, cyclePath };
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

/**
 * Topological sort using Kahn's algorithm (BFS-based).
 * @param {Map<string, string[]>} adjList - taskId -> [tasks it depends ON]
 * @param {string[]} allIds - All task IDs
 * @returns {string[]} Topologically sorted task IDs (execution order)
 */
function topologicalSort(adjList, allIds) {
  // Build reverse adjacency (for computing in-degree based on "dependsOn")
  // If A dependsOn B, then B must come before A.
  // So the edge is B -> A in execution order.
  const inDegree = new Map();
  const execAdj = new Map(); // B -> [A] meaning B must complete before A

  allIds.forEach((id) => {
    inDegree.set(id, 0);
    execAdj.set(id, []);
  });

  allIds.forEach((id) => {
    const deps = adjList.get(id) || [];
    inDegree.set(id, deps.length);
    deps.forEach((dep) => {
      if (execAdj.has(dep)) {
        execAdj.get(dep).push(id);
      }
    });
  });

  const queue = [];
  allIds.forEach((id) => {
    if (inDegree.get(id) === 0) queue.push(id);
  });

  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);

    const successors = execAdj.get(node) || [];
    for (const succ of successors) {
      inDegree.set(succ, inDegree.get(succ) - 1);
      if (inDegree.get(succ) === 0) {
        queue.push(succ);
      }
    }
  }

  return sorted;
}

/**
 * Critical Path Method (CPM).
 * Computes earliest/latest start/finish times and identifies the critical path.
 *
 * @param {Map<string, string[]>} adjList - taskId -> [tasks it depends ON]
 * @param {Map<string, number>} durations - taskId -> estimated duration (hours)
 * @param {string[]} topoOrder - Topologically sorted task IDs
 * @returns {{ criticalPath: string[], taskTimes: Map<string, {ES,EF,LS,LF,slack}>, totalDuration: number }}
 */
function criticalPath(adjList, durations, topoOrder) {
  // Forward pass: compute Earliest Start (ES) and Earliest Finish (EF)
  const ES = new Map();
  const EF = new Map();

  // Reverse adjacency: who depends on me?
  const successors = new Map();
  topoOrder.forEach((id) => successors.set(id, []));
  topoOrder.forEach((id) => {
    const deps = adjList.get(id) || [];
    deps.forEach((dep) => {
      if (successors.has(dep)) {
        successors.get(dep).push(id);
      }
    });
  });

  for (const id of topoOrder) {
    const deps = adjList.get(id) || [];
    let maxPredFinish = 0;
    for (const dep of deps) {
      const ef = EF.get(dep) || 0;
      if (ef > maxPredFinish) maxPredFinish = ef;
    }
    ES.set(id, maxPredFinish);
    EF.set(id, maxPredFinish + (durations.get(id) || 1));
  }

  // Total project duration
  let totalDuration = 0;
  topoOrder.forEach((id) => {
    const ef = EF.get(id) || 0;
    if (ef > totalDuration) totalDuration = ef;
  });

  // Backward pass: compute Latest Finish (LF) and Latest Start (LS)
  const LS = new Map();
  const LF = new Map();

  // Initialize all LF to totalDuration
  topoOrder.forEach((id) => LF.set(id, totalDuration));

  // Process in reverse topological order
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const succs = successors.get(id) || [];

    let minSuccStart = totalDuration;
    for (const succ of succs) {
      const ls = LS.get(succ) || totalDuration;
      if (ls < minSuccStart) minSuccStart = ls;
    }

    LF.set(id, minSuccStart);
    LS.set(id, minSuccStart - (durations.get(id) || 1));
  }

  // Compute slack and identify critical path
  const taskTimes = new Map();
  const criticalTasks = [];

  topoOrder.forEach((id) => {
    const slack = (LS.get(id) || 0) - (ES.get(id) || 0);
    taskTimes.set(id, {
      ES: ES.get(id) || 0,
      EF: EF.get(id) || 0,
      LS: LS.get(id) || 0,
      LF: LF.get(id) || 0,
      slack,
    });
    if (Math.abs(slack) < 0.001) {
      criticalTasks.push(id);
    }
  });

  return { criticalPath: criticalTasks, taskTimes, totalDuration };
}

/**
 * Check if adding a dependency would create a cycle.
 * @param {Map<string, string[]>} adjList - Current adjacency list
 * @param {string} taskId - The task that would gain a new dependency
 * @param {string} dependsOnId - The task it would depend on
 * @param {string[]} allIds - All task IDs
 * @returns {boolean} true if adding creates a cycle
 */
function wouldCreateCycle(adjList, taskId, dependsOnId, allIds) {
  // Temporarily add the edge and check for cycle
  const tempAdj = new Map();
  allIds.forEach((id) => {
    tempAdj.set(id, [...(adjList.get(id) || [])]);
  });

  if (!tempAdj.has(taskId)) tempAdj.set(taskId, []);
  tempAdj.get(taskId).push(dependsOnId);

  return detectCycle(tempAdj, allIds).hasCycle;
}

module.exports = {
  detectCycle,
  topologicalSort,
  criticalPath,
  wouldCreateCycle,
};
