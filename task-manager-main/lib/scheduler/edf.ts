export function edf(tasks: any[]) {

  return [...tasks].sort((a, b) => {

    const d1 = a.deadline
      ? new Date(a.deadline).getTime()
      : Infinity;

    const d2 = b.deadline
      ? new Date(b.deadline).getTime()
      : Infinity;

    if (d1 === d2) {

      if (a.priority === b.priority) {

        return (
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );

      }

      return a.priority - b.priority;

    }

    return d1 - d2;

  });

}