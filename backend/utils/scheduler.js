function fcfs(tasks) {
  return [...tasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function priorityScheduling(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.priority === b.priority) {
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    return a.priority - b.priority;
  });
}

function edf(tasks) {
  return [...tasks].sort((a, b) => {
    const d1 = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const d2 = b.deadline ? new Date(b.deadline).getTime() : Infinity;

    if (d1 === d2) {
      if (a.priority === b.priority) {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return a.priority - b.priority;
    }
    return d1 - d2;
  });
}

function roundRobin(tasks, quantum = 2) {
  const queue = tasks.map((t) => ({
    ...t,
    remaining: t.burstTime || 1,
  }));

  const result = [];

  while (queue.length > 0) {
    const task = queue.shift();
    if (!task) break;
    result.push(task);
    task.remaining -= quantum;
    if (task.remaining > 0) {
      queue.push(task);
    }
  }

  return result;
}

module.exports = { fcfs, priorityScheduling, edf, roundRobin };
