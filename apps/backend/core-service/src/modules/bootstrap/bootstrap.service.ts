import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { BootstrapData, Menu, MenuItem } from '@pawhaven/shared/types';
import { PrismaClient } from '@prismaClient/index.js';

const DEFAULT_ROLE = 'guest';

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  private readonly defaultRole = DEFAULT_ROLE;

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

  resolveRoles(roles?: string[]): string[] {
    return this.normalizeRoles(roles ?? []);
  }

  private async getActivePermissions(
    userRoles: string[],
  ): Promise<Array<{ id: string; code: string }>> {
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
      return [];
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
        permission: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    return rolePermissions.map(({ permission }) => permission);
  }

  private hasAccessByPermissions(
    requiredPermissionIds: string[],
    userPermissionIds: Set<string>,
  ): boolean {
    if (requiredPermissionIds.length === 0) {
      return true;
    }

    return requiredPermissionIds.some((permissionId) =>
      userPermissionIds.has(permissionId),
    );
  }

  async addMenuItem(menu: MenuItem): Promise<MenuItem> {
    try {
      const menuCreated = await this.prisma.menu.create({
        data: menu,
        select: {
          id: true,
          label: true,
          to: true,
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

  private applyAuthMenuFilter(
    menus: MenuItem[],
    isAuthenticated: boolean,
  ): MenuItem[] {
    if (!isAuthenticated) {
      return menus;
    }

    const loginMenus = menus.filter((menu) =>
      (menu.classNames ?? []).includes('login'),
    );

    if (loginMenus?.length === 0) {
      return menus;
    }

    const nonLoginMenus = menus.filter(
      (menu) => !(menu.classNames ?? []).includes('login'),
    );
    const maxOrder = nonLoginMenus.reduce(
      (max, menu) => Math.max(max, menu.order ?? 0),
      0,
    );

    return [
      ...nonLoginMenus,
      {
        label: 'auth.logout',
        to: loginMenus[0].to,
        classNames: ['logout'],
        order: maxOrder + 1,
      },
    ];
  }

  async getAppMenus(
    userRoles: string[] = [this.defaultRole],
    isAuthenticated = false,
  ): Promise<Menu> {
    try {
      const permissions = await this.getActivePermissions(userRoles);
      const userPermissionIds = new Set(permissions.map(({ id }) => id));

      const menus = await this.prisma.menu.findMany({
        where: {
          status: 'active',
          to: {
            startsWith: '/',
          },
        },
        select: {
          id: true,
          label: true,
          to: true,
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

      const visibleMenus = menus
        .filter((menu) =>
          this.hasAccessByPermissions(
            menu.menuPermissions.map((permission) => permission.permissionId),
            userPermissionIds,
          ),
        )
        .map((menu) => ({
          label: menu.label,
          to: menu.to,
          classNames: menu.classNames,
          order: menu.order,
        }));

      return this.applyAuthMenuFilter(visibleMenus, isAuthenticated);
    } catch (error) {
      this.logger.error('Failed to get app menus', error);
      throw new BadRequestException('get menus failed');
    }
  }

  async getBootstrapData(
    userRoles: string[] = [this.defaultRole],
    isAuthenticated = false,
  ): Promise<BootstrapData> {
    const permissions = await this.getActivePermissions(userRoles);
    const menus = await this.getAppMenus(userRoles, isAuthenticated);

    return {
      menus,
      permissions: Array.from(new Set(permissions.map(({ code }) => code))),
    };
  }
}
