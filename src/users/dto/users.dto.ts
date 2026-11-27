import {  IsNotEmpty, MinLength, IsPhoneNumber, IsString, IsEmail } from 'class-validator'
export class userDto {

    @IsNotEmpty()
    @IsString()
    username!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;
    
    @IsNotEmpty()
    @MinLength(8)
    password!: string;

    @IsNotEmpty()
    @IsPhoneNumber('MZ')
    contato!: string;
}