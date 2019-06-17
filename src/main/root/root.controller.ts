import { Controller, Post, Req, Body, Get, Res } from '@nestjs/common';
import { ApiUseTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { RootService } from './root.service';

@ApiUseTags('Root')
@Controller('/')
export class RootController {
    constructor(
        readonly userService: UserService,
        readonly rootService: RootService
    ) {

    }
    
    
    @Get('/login')
	login(@Res() res) {
		return this.userService.renderLogin(res);
    }
    
    @Get('/app')
	app(@Req() req, @Res() res) {
		return this.rootService.renderApp(req.user, res);
    }

    @Get('/portfolio')
	portfolio(@Req() req, @Res() res) {
		return this.rootService.renderPortfolio(req.user, res);
    }
    
    @Get('/')
	index(@Res() res) {
		return this.rootService.renderIndex(res);
	}
}
