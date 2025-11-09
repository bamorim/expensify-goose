import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { TRPCContext } from "~/server/api/trpc";

/**
 * Helper function to check if user is admin of organization
 */
async function checkOrgAdmin(context: TRPCContext, organizationId: string) {
  if (!context.session) {
    throw new Error("You must be logged in to perform this action");
  }

  const userOrg = await context.db.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: context.session.user.id,
        organizationId,
      },
    },
  });

  if (!userOrg || userOrg.role !== "ADMIN") {
    throw new Error("Only organization admins can perform this action");
  }

  return userOrg;
}

/**
 * Helper function to check if user is member of organization
 */
async function checkOrgMember(context: TRPCContext, organizationId: string) {
  if (!context.session) {
    throw new Error("You must be logged in to perform this action");
  }

  const userOrg = await context.db.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: context.session.user.id,
        organizationId,
      },
    },
  });

  if (!userOrg) {
    throw new Error(
      "You must be a member of this organization to view categories",
    );
  }

  return userOrg;
}

export const categoryRouter = createTRPCRouter({
  /**
   * Create a new expense category (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin of the organization
      await checkOrgAdmin(ctx, input.organizationId);

      // Check if category with same name already exists in this organization
      const existingCategory = await ctx.db.expenseCategory.findFirst({
        where: {
          name: input.name,
          organizationId: input.organizationId,
        },
      });

      if (existingCategory) {
        throw new Error(
          "A category with this name already exists in your organization",
        );
      }

      // Create the category
      const category = await ctx.db.expenseCategory.create({
        data: {
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
        },
      });

      return category;
    }),

  /**
   * Get all categories for an organization
   */
  getCategories: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is member of the organization
      await checkOrgMember(ctx, input.organizationId);

      const categories = await ctx.db.expenseCategory.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: {
          name: "asc",
        },
      });

      return categories;
    }),

  /**
   * Get a single category by ID
   */
  getCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().cuid(),
        organizationId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is member of the organization
      await checkOrgMember(ctx, input.organizationId);

      const category = await ctx.db.expenseCategory.findFirst({
        where: {
          id: input.categoryId,
          organizationId: input.organizationId,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  /**
   * Update a category (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().cuid(),
        organizationId: z.string().cuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin of the organization
      await checkOrgAdmin(ctx, input.organizationId);

      // Check if category exists and belongs to this organization
      const existingCategory = await ctx.db.expenseCategory.findFirst({
        where: {
          id: input.categoryId,
          organizationId: input.organizationId,
        },
      });

      if (!existingCategory) {
        throw new Error("Category not found");
      }

      // If updating name, check for duplicates
      if (input.name && input.name !== existingCategory.name) {
        const duplicateCategory = await ctx.db.expenseCategory.findFirst({
          where: {
            name: input.name,
            organizationId: input.organizationId,
            id: { not: input.categoryId },
          },
        });

        if (duplicateCategory) {
          throw new Error(
            "A category with this name already exists in your organization",
          );
        }
      }

      // Update the category
      const updatedCategory = await ctx.db.expenseCategory.update({
        where: {
          id: input.categoryId,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
        },
      });

      return updatedCategory;
    }),

  /**
   * Delete a category (admin only)
   */
  delete: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().cuid(),
        organizationId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin of the organization
      await checkOrgAdmin(ctx, input.organizationId);

      // Check if category exists and belongs to this organization
      const existingCategory = await ctx.db.expenseCategory.findFirst({
        where: {
          id: input.categoryId,
          organizationId: input.organizationId,
        },
        include: {
          expenses: {
            take: 1, // Just check if there are any expenses
          },
          policies: {
            take: 1, // Just check if there are any policies
          },
        },
      });

      if (!existingCategory) {
        throw new Error("Category not found");
      }

      // Check if category is being used
      if (existingCategory.expenses.length > 0) {
        throw new Error(
          "Cannot delete category that is being used by expenses. Archive it instead.",
        );
      }

      if (existingCategory.policies.length > 0) {
        throw new Error(
          "Cannot delete category that has policies assigned. Remove policies first.",
        );
      }

      // Delete the category
      await ctx.db.expenseCategory.delete({
        where: {
          id: input.categoryId,
        },
      });

      return { success: true };
    }),
});
