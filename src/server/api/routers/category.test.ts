import { describe, it, expect, vi, beforeEach } from "vitest";
import { categoryRouter } from "./category";
import { db } from "~/server/db";
import { faker } from "@faker-js/faker";

// Mock the database to use the transactional testing wrapper
vi.mock("~/server/db");

// Mock the auth module
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("CategoryRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a category successfully", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
          description: "A test organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.create({
        organizationId: organization.id,
        name: "Test Category",
        description: "A test category",
      });

      expect(result.name).toEqual("Test Category");
      expect(result.description).toEqual("A test category");
      expect(result.organizationId).toEqual(organization.id);

      // Verify the category was created
      const category = await db.expenseCategory.findUnique({
        where: {
          id: result.id,
        },
      });

      expect(category).toBeDefined();
      expect(category?.name).toEqual("Test Category");
    });

    it("should create category without description", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.create({
        organizationId: organization.id,
        name: "Simple Category",
      });

      expect(result.name).toEqual("Simple Category");
      expect(result.description).toBeNull();
    });

    it("should not allow non-admin to create category", async () => {
      const member = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member (not admin)
      await db.userOrganization.create({
        data: {
          userId: member.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const mockSession = {
        user: member,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.create({
          organizationId: organization.id,
          name: "Test Category",
        }),
      ).rejects.toThrow("Only organization admins can perform this action");
    });

    it("should not allow duplicate category names", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      // Create existing category
      await db.expenseCategory.create({
        data: {
          name: "Existing Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.create({
          organizationId: organization.id,
          name: "Existing Category",
        }),
      ).rejects.toThrow("A category with this name already exists in your organization");
    });
  });

  describe("getCategories", () => {
    it("should return organization categories for member", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      // Create test categories
      await db.expenseCategory.createMany({
        data: [
          {
            name: "Category B",
            organizationId: organization.id,
          },
          {
            name: "Category A",
            organizationId: organization.id,
          },
        ],
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getCategories({
        organizationId: organization.id,
      });

      expect(result).toHaveLength(2);
      expect(result.map((cat) => cat.name)).toContain("Category A");
      expect(result.map((cat) => cat.name)).toContain("Category B");
      // Verify alphabetical sorting
      expect(result[0]?.name).toEqual("Category A");
      expect(result[1]?.name).toEqual("Category B");
    });

    it("should return empty array for organization with no categories", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getCategories({
        organizationId: organization.id,
      });

      expect(result).toHaveLength(0);
    });

    it("should throw error for non-member", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.getCategories({ organizationId: organization.id }),
      ).rejects.toThrow("You must be a member of this organization to view categories");
    });
  });

  describe("getCategory", () => {
    it("should return category for member", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getCategory({
        categoryId: category.id,
        organizationId: organization.id,
      });

      expect(result?.name).toEqual("Test Category");
    });

    it("should throw error for non-member", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.getCategory({
          categoryId: category.id,
          organizationId: organization.id,
        }),
      ).rejects.toThrow("You must be a member of this organization to view categories");
    });

    it("should throw error for non-existent category", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.getCategory({
          categoryId: "cm1234567890abcdef123456", // Fake ID
          organizationId: organization.id,
        }),
      ).rejects.toThrow("Category not found");
    });
  });

  describe("update", () => {
    it("should update category successfully", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Original Category",
          description: "Original description",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.update({
        categoryId: category.id,
        organizationId: organization.id,
        name: "Updated Category",
        description: "Updated description",
      });

      expect(result.name).toEqual("Updated Category");
      expect(result.description).toEqual("Updated description");
    });

    it("should update only name", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Original Category",
          description: "Original description",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.update({
        categoryId: category.id,
        organizationId: organization.id,
        name: "Updated Category",
      });

      expect(result.name).toEqual("Updated Category");
      expect(result.description).toEqual("Original description"); // Should remain unchanged
    });

    it("should not allow non-admin to update category", async () => {
      const member = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member (not admin)
      await db.userOrganization.create({
        data: {
          userId: member.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user: member,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.update({
          categoryId: category.id,
          organizationId: organization.id,
          name: "Updated Category",
        }),
      ).rejects.toThrow("Only organization admins can perform this action");
    });

    it("should not allow duplicate category names on update", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      // Create two categories
      const category1 = await db.expenseCategory.create({
        data: {
          name: "Category 1",
          organizationId: organization.id,
        },
      });

      // Create category2 to test duplicate name prevention
      await db.expenseCategory.create({
        data: {
          name: "Category 2",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.update({
          categoryId: category1.id,
          organizationId: organization.id,
          name: "Category 2", // Try to use name of existing category
        }),
      ).rejects.toThrow("A category with this name already exists in your organization");
    });
  });

  describe("delete", () => {
    it("should delete category successfully", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.delete({
        categoryId: category.id,
        organizationId: organization.id,
      });

      expect(result.success).toBe(true);

      // Verify category was deleted
      const deletedCategory = await db.expenseCategory.findUnique({
        where: {
          id: category.id,
        },
      });

      expect(deletedCategory).toBeNull();
    });

    it("should not allow non-admin to delete category", async () => {
      const member = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as member (not admin)
      await db.userOrganization.create({
        data: {
          userId: member.id,
          organizationId: organization.id,
          role: "MEMBER",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      const mockSession = {
        user: member,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.delete({
          categoryId: category.id,
          organizationId: organization.id,
        }),
      ).rejects.toThrow("Only organization admins can perform this action");
    });

    it("should not delete category with expenses", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      // Create an expense using this category
      await db.expense.create({
        data: {
          amount: 100,
          description: "Test Expense",
          date: new Date(),
          categoryId: category.id,
          organizationId: organization.id,
          userId: user.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.delete({
          categoryId: category.id,
          organizationId: organization.id,
        }),
      ).rejects.toThrow("Cannot delete category that is being used by expenses. Archive it instead.");
    });

    it("should not delete category with policies", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const category = await db.expenseCategory.create({
        data: {
          name: "Test Category",
          organizationId: organization.id,
        },
      });

      // Create a policy using this category
      await db.policy.create({
        data: {
          name: "Test Policy",
          organizationId: organization.id,
          categoryId: category.id,
          maxAmount: 100,
          autoApprove: false,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.delete({
          categoryId: category.id,
          organizationId: organization.id,
        }),
      ).rejects.toThrow("Cannot delete category that has policies assigned. Remove policies first.");
    });

    it("should throw error for non-existent category", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const organization = await db.organization.create({
        data: {
          name: "Test Organization",
        },
      });

      // Add user as admin
      await db.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.delete({
          categoryId: "cm1234567890abcdef123456", // Fake ID
          organizationId: organization.id,
        }),
      ).rejects.toThrow("Category not found");
    });
  });
});
