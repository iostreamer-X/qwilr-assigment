import { Controller, Post, Req, Body } from '@nestjs/common';
import { ApiUseTags, ApiImplicitHeader } from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { AddBalanceDto } from './dto/add-balance.dto';

@ApiUseTags('Balance')
@Controller('balance')
export class BalanceController {
    constructor(readonly balanceService: BalanceService) {

    }
    
	@ApiImplicitHeader({ name: 'token' })
    @Post('/add')
	add(@Req() req, @Body() dto: AddBalanceDto) {
        const { user } = req;
		return this.balanceService.addBalance(user, dto);
    }
}
