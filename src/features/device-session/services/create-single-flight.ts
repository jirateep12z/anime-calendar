export function CreateSingleFlight<Result>(
  RunOperation: () => Promise<Result>
): () => Promise<Result> {
  let pending_operation: Promise<Result> | null = null;

  return function RunSingleFlight(): Promise<Result> {
    pending_operation ??= RunOperation();
    const current_operation = pending_operation;

    return current_operation.finally(() => {
      if (pending_operation === current_operation) {
        pending_operation = null;
      }
    });
  };
}
