import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { readHeader } from '@pawhaven/backend-core/utils';
import type { HomeData } from '@pawhaven/shared/types';

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
      'Get combined home data: menus, routers, hero statistics, latest rescues and adoptable pets',
  })
  getHomeData(@Req() req: Request): Promise<HomeData> {
    const verifiedHeader = readHeader(req.headers, httpHeaders.authVerified);
    const userRolesHeader = readHeader(req.headers, httpHeaders.authUserRoles);
    const userRoles = this.homeService.resolveRequestRoles(userRolesHeader);
    const isAuthenticated = verifiedHeader === '1';

    return this.homeService.getHomeData(isAuthenticated, userRoles);
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
