export function roundRobin(tasks: any[], quantum = 2) {

  const queue = tasks.map(t => ({
    ...t,
    remaining: t.burstTime || 1
  }));

  const result: any[] = [];

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