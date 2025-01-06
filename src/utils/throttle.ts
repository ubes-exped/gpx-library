/**
 * Throttle a function, so it only gets called every `wait` ms
 *
 * The function gets called immediately if it hasn’t been called in the last `wait` ms.
 * Otherwise, it is called `wait` ms after it was last called, with the most recent values passed
 * to it.
 */
export default function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  onClear?: () => void,
  wait = 100,
) {
  let cachedArgs: T | undefined;
  let timeout: number | undefined;

  const callAndTimeout = (...args: T) => {
    func(...args);
    timeout = setTimeout(() => {
      if (cachedArgs) {
        callAndTimeout(...cachedArgs);
        cachedArgs = undefined;
      } else {
        timeout = undefined;
      }
    }, wait);
  };

  const send = (...args: T) => {
    if (!timeout) callAndTimeout(...args);
    else cachedArgs = args;
  };

  const clear = () => {
    clearTimeout(timeout);
    timeout = undefined;
    cachedArgs = undefined;
    onClear?.();
  };

  return { send, clear };
}
