import { IsEmail, IsString } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiModelProperty()
    @IsEmail()
    email: string;
    
    @ApiModelProperty()
    @IsString()
    password: string;
}