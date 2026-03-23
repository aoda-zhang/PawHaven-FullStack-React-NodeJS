import { Body, Controller, Get, Headers, Post } from '@nestjs/common';

import { BootstrapService } from './bootstrap.service';
import { MenuItemDto } from './DTO/menu.DTO';
import { CreatedRouteDTO, RouterItemDTO } from './DTO/router.DTO';

@Controller('/app')
export class BootstrapController {
  constructor(private readonly bootService: BootstrapService) {}

  @Get('/bootstrap')
  getAppBootstrap(
    @Headers('x-auth-user-roles') userRolesHeader?: string,
  ): Promise<{
    menus: MenuItemDto[];
    routers: RouterItemDTO[];
  }> {
    const userRoles = this.bootService.resolveRequestRoles(userRolesHeader);

    return this.bootService.getAppBootstrap(userRoles);
  }

  @Get('/menu')
  getMenus(
    @Headers('x-auth-user-roles') userRolesHeader?: string,
  ): Promise<MenuItemDto[]> {
    const userRoles = this.bootService.resolveRequestRoles(userRolesHeader);

    return this.bootService.getAppMenus(userRoles);
  }

  @Post('/menu')
  createMenu(@Body() menu: MenuItemDto): Promise<MenuItemDto> {
    return this.bootService.addMenuItem(menu);
  }

  @Post('/router')
  createRouter(@Body() router: RouterItemDTO): Promise<CreatedRouteDTO> {
    return this.bootService.addAppRouter(router);
  }
}
