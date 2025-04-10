
import { isValidUUID } from "../utils";

describe("Mission Service Utils", () => {
  describe("isValidUUID", () => {
    test("should return true for valid UUIDs", () => {
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd",
        "A987FBC9-4BED-3078-CF07-9141BA07C9F3"
      ];
      
      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });
    
    test("should return false for invalid UUIDs", () => {
      const invalidUUIDs = [
        "",
        "not-a-uuid",
        "123e4567-e89b-12d3-a456", // incomplete
        "123e4567-e89b-12d3-a456-4266141740001", // too long
        "123e4567-e89b-12d3-a456_426614174000", // invalid character
        null,
        undefined
      ];
      
      invalidUUIDs.forEach(uuid => {
        // @ts-ignore - testing with invalid inputs
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });
});
