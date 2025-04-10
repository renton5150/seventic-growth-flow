
/**
 * Checks if a string is a valid UUID
 * @param str String to check
 * @returns Boolean indicating if the string is a valid UUID
 */
export const isValidUUID = (str: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};
