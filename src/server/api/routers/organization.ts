import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the organization
      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });

      // Add the creator as an admin
      await ctx.db.userOrganization.create({
        data: {
          userId: ctx.session.user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      return organization;
    }),

  getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userOrganizations = await ctx.db.userOrganization.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return userOrganizations.map((uo) => uo.organization);
  }),

  getOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is a member of the organization
      const membership = await ctx.db.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new Error("Access denied: Not a member of this organization");
      }

      return { role: membership.role, ...membership.organization };
    }),

  inviteUser: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of the organization
      const membership = await ctx.db.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new Error("Access denied: Only admins can invite users");
      }

      // Find the user to invite
      const userToInvite = await ctx.db.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (!userToInvite) {
        throw new Error("User with this email does not exist");
      }

      // Check if user is already a member
      const existingMembership = await ctx.db.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: userToInvite.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }

      // Create the invitation (in a real app, you'd send an email here)
      await ctx.db.userOrganization.create({
        data: {
          userId: userToInvite.id,
          organizationId: input.organizationId,
          role: "MEMBER",
        },
      });

      return {
        success: true,
        user: {
          id: userToInvite.id,
          email: userToInvite.email,
          name: userToInvite.name,
        },
      };
    }),

  getMembers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user is a member of the organization
      const membership = await ctx.db.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new Error("Access denied: Not a member of this organization");
      }

      const members = await ctx.db.userOrganization.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return members.map(({ role, user }) => ({ ...user, role }));
    }),
});
