export function priorityScheduling(tasks: any[]) {

  return [...tasks].sort((a, b) => {

    if (a.priority === b.priority) {

      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );

    }

    return a.priority - b.priority;

  });

}