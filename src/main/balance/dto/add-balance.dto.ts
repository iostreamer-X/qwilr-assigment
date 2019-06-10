import { IsString, IsNumber } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class AddBalanceDto {
    @ApiModelProperty()
    @IsNumber()
    balance: number
}