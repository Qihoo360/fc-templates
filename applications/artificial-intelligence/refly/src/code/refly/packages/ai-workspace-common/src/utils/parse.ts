export const safeParseJSON = (value: any, errorCallback?: (e: unknown) => any): any => {
  try {
    return JSON.parse(value);
  } catch (e) {
    if (errorCallback) {
      return errorCallback(e);
    }
    return undefined;
  }
};

export const safeStringifyJSON = (value: any, errorCallback?: (e: unknown) => string): string => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    if (errorCallback) {
      return errorCallback(e);
    }
    return '';
  }
};

export function isJSON(variable: any): boolean {
  if (typeof variable !== 'string' || !variable.startsWith('{') || !variable.endsWith('}')) {
    return false;
  }
  try {
    JSON.parse(variable);
    return true;
  } catch (_error) {
    return false;
  }
}
