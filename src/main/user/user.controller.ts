import { Controller, Post, Req, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { ApiUseTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';

@ApiUseTags('User')
@Controller('user')
export class UserController {
    constructor(readonly userService: UserService) {

    }
    
    @Post('/create')
	create(@Body() dto: CreateUserDto) {
		return this.userService.createUser(dto);
    }
    
    @Post('/login')
	login(@Body() dto: LoginUserDto) {
		return this.userService.login(dto);
	}
}
