import { Controller, Post, Req, Body, Get } from '@nestjs/common';
import { ApiUseTags, ApiImplicitHeader } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { BuyStocksDto } from './dto/buy-stocks.dto';


@ApiUseTags('Balance')
@Controller('balance')
export class PortfolioController {
    constructor(readonly portfolioService: PortfolioService) {

    }
    
	@ApiImplicitHeader({ name: 'token' })
    @Post('/stocks/buy')
	add(@Req() req, @Body() dto: BuyStocksDto) {
        const { user } = req;
		return this.portfolioService.buyStocks(user, dto);
    }

    @ApiImplicitHeader({ name: 'token' })
    @Get('/get')
	get(@Req() req) {
        const { user } = req;
		return this.portfolioService.get(user);
    }
}
