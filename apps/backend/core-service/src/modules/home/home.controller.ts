import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HeroStats } from '@pawhaven/shared/types';

import { MenuItemDto } from './DTO/menu.DTO';
import { CreatedRouteDTO, RouterItemDTO } from './DTO/router.DTO';
import { HomeService } from './home.service';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get combined home data: menus, routers and hero section statistics',
  })
  getHomeData(@Headers('x-auth-user-roles') userRolesHeader?: string): Promise<{
    menus: MenuItemDto[];
    routers: RouterItemDTO[];
    heroStats: HeroStats;
  }> {
    const userRoles = this.homeService.resolveRequestRoles(userRolesHeader);

    return this.homeService.getHomeData(userRoles);
  }

  @Post('/menu')
  createMenu(@Body() menu: MenuItemDto): Promise<MenuItemDto> {
    return this.homeService.addMenuItem(menu);
  }

  @Post('/router')
  createRouter(@Body() router: RouterItemDTO): Promise<CreatedRouteDTO> {
    return this.homeService.addAppRouter(router);
  }
}
