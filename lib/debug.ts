export function logDebug(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG][${timestamp}] ${message}`);
}
