import { prisma } from "@src/lib/prisma";



function startOfToday(): Date {

  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());

}



function daysAgo(days: number): Date {

  const d = startOfToday();

  d.setDate(d.getDate() - days);

  return d;

}



export type SistemaUserStats = {

  total: number;

  active: number;

  inactive: number;

  byRole: { roleId: string; roleLabel: string; roleKey: string; count: number }[];

};



export type SistemaAuditStats = {

  total: number;

  today: number;

  last7Days: number;

  lastEventAt: Date | null;

  topActions: { action: string; count: number }[];

};



export async function getSistemaUserStats(): Promise<SistemaUserStats> {

  const [total, active, roleGroups] = await Promise.all([

    prisma.user.count(),

    prisma.user.count({ where: { active: true } }),

    prisma.user.groupBy({

      by: ["roleId"],

      _count: { _all: true },

      orderBy: { roleId: "asc" },

    }),

  ]);



  const roleIds = roleGroups.map((g) => g.roleId);

  const roles = await prisma.authRole.findMany({

    where: { id: { in: roleIds } },

    select: { id: true, label: true, key: true },

  });

  const roleMap = new Map(roles.map((r) => [r.id, r]));



  return {

    total,

    active,

    inactive: total - active,

    byRole: roleGroups.map((g) => {

      const role = roleMap.get(g.roleId);

      return {

        roleId: g.roleId,

        roleLabel: role?.label ?? "—",

        roleKey: role?.key ?? "—",

        count: g._count._all,

      };

    }),

  };

}



export async function getSistemaAuditStats(): Promise<SistemaAuditStats> {

  const since7 = daysAgo(7);

  const sinceToday = startOfToday();



  const [total, today, last7Days, lastLog, actionGroups] = await Promise.all([

    prisma.auditLog.count(),

    prisma.auditLog.count({ where: { createdAt: { gte: sinceToday } } }),

    prisma.auditLog.count({ where: { createdAt: { gte: since7 } } }),

    prisma.auditLog.findFirst({

      orderBy: { createdAt: "desc" },

      select: { createdAt: true },

    }),

    prisma.auditLog.groupBy({

      by: ["action"],

      _count: { _all: true },

      orderBy: { _count: { action: "desc" } },

      take: 5,

    }),

  ]);



  return {

    total,

    today,

    last7Days,

    lastEventAt: lastLog?.createdAt ?? null,

    topActions: actionGroups.map((g) => ({ action: g.action, count: g._count._all })),

  };

}

