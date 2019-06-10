import { IsNumber, IsPositive, IsString } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class BuyStocksDto {
    @ApiModelProperty()
    @IsString()
    name: string;

    @ApiModelProperty()
    @IsPositive()
    @IsNumber()
    quantity: number;
}