export function fcfs(tasks: any[]) {

  return [...tasks].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );

}