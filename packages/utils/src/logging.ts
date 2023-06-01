/**
 * Offers basic logging functionality so you can use on the code, with some options to ignore some logs if you need to.
 *
 * @param name - The name of the logger, it will be shown on the console.
 * @param options - Options to configure the logger.
 */
export default function logger(
  name: string | string[],
  options?: {
    log?: boolean;
    error?: boolean;
    warn?: boolean;
    debug?: boolean;
    ignoreAll?: boolean;
    toFile?: string;
  }
) {
  const prefixes = Array.isArray(name) ? name : [name];
  const formattedPrefixes = prefixes.map((prefix) => `[${prefix}]`);

  function log(...args: Parameters<typeof console.log>) {
    if (options?.ignoreAll || options?.log === false) return;
    console.log(...formattedPrefixes, ...args);
  }

  function error(...args: Parameters<typeof console.error>) {
    if (options?.ignoreAll || options?.error === false) return;
    console.error(...formattedPrefixes, ...args);
  }

  function warn(...args: Parameters<typeof console.warn>) {
    if (options?.ignoreAll || options?.warn === false) return;
    console.warn(...formattedPrefixes, ...args);
  }

  function debug(...args: Parameters<typeof console.debug>) {
    if (options?.ignoreAll || options?.debug === false) return;
    console.debug(...formattedPrefixes, ...args);
  }

  function child(childName: string | string[]) {
    return logger(
      [
        ...(Array.isArray(name) ? name : [name]),
        ...(Array.isArray(childName) ? childName : [childName]),
      ],
      options
    );
  }

  return {
    log,
    error,
    warn,
    debug,
    child,
  };
}
