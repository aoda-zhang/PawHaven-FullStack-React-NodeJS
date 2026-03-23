import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { MenuItem, Menu, Router, RouterItem } from '@pawhaven/shared/types';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient, Prisma } from '@prismaClient';

import { CreatedRouteDTO } from './DTO/router.DTO';

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  private readonly defaultRole = 'guest';

  private readonly maxRouteDepth = 3;

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  private normalizeRoles(roles: string[]): string[] {
    const normalized = roles
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);

    return normalized.length > 0
      ? Array.from(new Set(normalized))
      : [this.defaultRole];
  }

  resolveRequestRoles(userRolesHeader?: string): string[] {
    const rolesFromHeader = (userRolesHeader ?? '')
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);

    return this.normalizeRoles(rolesFromHeader);
  }

  private async getPermissionSetByRoles(
    userRoles: string[],
  ): Promise<Set<string>> {
    const normalizedRoles = this.normalizeRoles(userRoles);
    const roleRecords = await this.prisma.role.findMany({
      where: {
        status: 'active',
        key: {
          in: normalizedRoles,
        },
      },
      select: {
        id: true,
      },
    });

    if (roleRecords.length === 0) {
      return new Set<string>();
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleRecords.map((role) => role.id),
        },
        permission: {
          is: {
            status: 'active',
          },
        },
      },
      select: {
        permissionId: true,
      },
    });

    return new Set(
      rolePermissions.map((permission) => permission.permissionId),
    );
  }

  private hasAccessByPermissions(
    requiredPermissionIds: string[],
    userPermissionSet: Set<string>,
  ): boolean {
    if (requiredPermissionIds.length === 0) {
      return true;
    }

    return requiredPermissionIds.some((permissionId) =>
      userPermissionSet.has(permissionId),
    );
  }

  private normalizeRouteHandle(
    handle: RouterItem['handle'] | undefined,
  ): Prisma.InputJsonValue {
    return { ...(handle ?? {}) } as Prisma.InputJsonValue;
  }

  private async validateAndGetParentDepth(parentId?: string): Promise<number> {
    if (!parentId) {
      return 0;
    }

    const routeIndex = await this.prisma.route.findMany({
      select: {
        id: true,
        parentId: true,
        status: true,
      },
    });

    const routeMap = new Map(
      routeIndex.map((route) => [
        route.id,
        { parentId: route.parentId, status: route.status },
      ]),
    );

    let depth = 1;
    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException(
          'invalid route tree: cyclic parent chain',
        );
      }
      visited.add(currentParentId);

      const parent = routeMap.get(currentParentId);

      if (!parent) {
        throw new BadRequestException(
          `parent route not found: ${currentParentId}`,
        );
      }

      if (parent.status !== 'active') {
        throw new BadRequestException('parent route is not active');
      }

      if (!parent.parentId) {
        break;
      }

      depth += 1;
      currentParentId = parent.parentId;
    }

    return depth;
  }

  async addMenuItem(menu: MenuItem): Promise<MenuItem> {
    try {
      const menuCreated = await this.prisma.menu.create({
        data: menu,
        select: {
          id: true,
          label: true,
          type: true,
          to: true,
          component: true,
          classNames: true,
          order: true,
        },
      });

      return menuCreated;
    } catch (error) {
      this.logger.error(`Failed to add menu: ${menu?.label}`, error);
      throw new BadRequestException(`add menu :${menu?.label} failed`);
    }
  }

  async getAppMenus(userRoles: string[] = [this.defaultRole]): Promise<Menu> {
    try {
      const userPermissionSet = await this.getPermissionSetByRoles(userRoles);
      const menus = await this.prisma.menu.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          label: true,
          type: true,
          to: true,
          component: true,
          classNames: true,
          order: true,
          menuPermissions: {
            select: {
              permissionId: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return menus
        .filter((menu) =>
          this.hasAccessByPermissions(
            menu.menuPermissions.map((permission) => permission.permissionId),
            userPermissionSet,
          ),
        )
        .map((menu) => ({
          label: menu.label,
          type: menu.type,
          to: menu.to,
          component: menu.component,
          classNames: menu.classNames,
          order: menu.order,
        }));
    } catch (error) {
      this.logger.error('Failed to get app menus', error);
      throw new BadRequestException('get menus failed');
    }
  }

  async addAppRouter(
    router: RouterItem & { parentId?: string },
  ): Promise<CreatedRouteDTO> {
    const parentDepth = await this.validateAndGetParentDepth(router.parentId);
    const newRouteDepth = parentDepth + 1;

    if (newRouteDepth > this.maxRouteDepth) {
      throw new BadRequestException(
        `route depth exceeded: max depth is ${this.maxRouteDepth}`,
      );
    }

    const createdRouterItem = await this.prisma.route.create({
      data: {
        path: router.path,
        element: router.element,
        handle: this.normalizeRouteHandle(router.handle),
        ...(router?.parentId
          ? {
              parent: { connect: { id: router.parentId } },
            }
          : {}),
      },
      select: {
        path: true,
        element: true,
        handle: true,
      },
    });

    return createdRouterItem;
  }

  async getAppBootstrap(
    userRoles: string[] = [this.defaultRole],
  ): Promise<{ menus: Menu; routers: Router }> {
    const menus = await this.getAppMenus(userRoles);
    const routers = await this.getAppRouters(userRoles);

    return {
      menus,
      routers,
    };
  }

  async getAppRouters(
    userRoles: string[] = [this.defaultRole],
  ): Promise<Router> {
    const userPermissionSet = await this.getPermissionSetByRoles(userRoles);
    const routes = await this.prisma.route.findMany({
      select: {
        id: true,
        path: true,
        element: true,
        handle: true,
        parentId: true,
        order: true,
        status: true,
        routePermissions: {
          select: {
            permissionId: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const activeRoutes = routes.filter(
      (route: (typeof routes)[number]) => route.status === 'active',
    );

    const activeRouteMap = new Map(
      activeRoutes.map((route: (typeof activeRoutes)[number]) => [
        route.id,
        route,
      ]),
    );

    const visibleRouteIds = new Set(
      activeRoutes
        .filter((route: (typeof activeRoutes)[number]) =>
          this.hasAccessByPermissions(
            route.routePermissions.map((permission) => permission.permissionId),
            userPermissionSet,
          ),
        )
        .map((route: (typeof activeRoutes)[number]) => route.id),
    );

    visibleRouteIds.forEach((routeId) => {
      let current = activeRouteMap.get(routeId);

      while (current?.parentId) {
        const parent = activeRouteMap.get(current.parentId);
        if (!parent) break;

        visibleRouteIds.add(parent.id);
        current = parent;
      }
    });

    const sortedVisibleRoutes = activeRoutes
      .filter((route: (typeof activeRoutes)[number]) =>
        visibleRouteIds.has(route.id),
      )
      .sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.element.localeCompare(b.element);
      });

    const routeMap = new Map<string, RouterItem>();

    sortedVisibleRoutes.forEach(
      (route: (typeof sortedVisibleRoutes)[number]) => {
        routeMap.set(route.id, {
          path: route.path,
          element: route.element,
          handle:
            route.handle &&
            typeof route.handle === 'object' &&
            !Array.isArray(route.handle)
              ? (route.handle as RouterItem['handle'])
              : {},
          children: [],
        });
      },
    );

    const result: RouterItem[] = [];

    sortedVisibleRoutes.forEach(
      (route: (typeof sortedVisibleRoutes)[number]) => {
        const current = routeMap.get(route.id);
        if (!current) return;

        if (route.parentId) {
          const parent = routeMap.get(route.parentId);
          if (!parent) {
            result.push(current);
            return;
          }

          parent.children = parent.children
            ? [...parent.children, current]
            : [current];
        } else {
          result.push(current);
        }
      },
    );

    return result;
  }
}
