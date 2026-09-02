import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  createColumnSchema,
  reorderColumnsSchema,
  deleteColumnSchema,
} from "@/lib/validations/project";

describe("Project and Board Zod Validation Schemas", () => {
  describe("createProjectSchema", () => {
    it("accepts valid project payload and transforms key to uppercase", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "ws-123",
        name: "Meridian Core",
        key: "mer",
        description: "Primary project repository",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("MER");
        expect(result.data.name).toBe("Meridian Core");
        expect(result.data.workspaceId).toBe("ws-123");
        expect(result.data.description).toBe("Primary project repository");
      }
    });

    it("rejects project key shorter than 2 characters", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "ws-123",
        name: "Meridian Core",
        key: "M",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("rejects project key longer than 10 characters", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "ws-123",
        name: "Meridian Core",
        key: "VERYLONGPROJECTKEY",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot exceed 10 characters");
      }
    });

    it("rejects project key with special characters", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "ws-123",
        name: "Meridian Core",
        key: "ME-R",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("letters and numbers");
      }
    });

    it("rejects project name shorter than 2 characters", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "ws-123",
        name: "A",
        key: "MER",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("rejects missing workspaceId", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "",
        name: "Meridian Core",
        key: "MER",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Workspace ID is required");
      }
    });
  });

  describe("createColumnSchema", () => {
    it("accepts valid column payload with optional order", () => {
      const result = createColumnSchema.safeParse({
        boardId: "board-123",
        name: "Quality Assurance",
        order: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Quality Assurance");
        expect(result.data.order).toBe(5);
      }
    });

    it("accepts valid column payload without order", () => {
      const result = createColumnSchema.safeParse({
        boardId: "board-123",
        name: "Triage",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBeUndefined();
      }
    });

    it("rejects empty column name", () => {
      const result = createColumnSchema.safeParse({
        boardId: "board-123",
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Column name is required");
      }
    });

    it("rejects negative order numbers", () => {
      const result = createColumnSchema.safeParse({
        boardId: "board-123",
        name: "Done",
        order: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("non-negative");
      }
    });
  });

  describe("reorderColumnsSchema", () => {
    it("accepts valid columnIds array", () => {
      const result = reorderColumnsSchema.safeParse({
        boardId: "board-123",
        columnIds: ["col-1", "col-2", "col-3"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.columnIds).toEqual(["col-1", "col-2", "col-3"]);
      }
    });

    it("rejects empty columnIds array", () => {
      const result = reorderColumnsSchema.safeParse({
        boardId: "board-123",
        columnIds: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one column ID");
      }
    });
  });

  describe("deleteColumnSchema", () => {
    it("accepts valid columnId", () => {
      const result = deleteColumnSchema.safeParse({
        columnId: "col-123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty columnId", () => {
      const result = deleteColumnSchema.safeParse({
        columnId: "",
      });

      expect(result.success).toBe(false);
    });
  });
});
