import { IsEmail, IsNotEmpty, IsPhoneNumber, MaxLength, MinLength } from "class-validator";

export class signInDto {
    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    password!:string;
}
export class signUpDto {
    @IsNotEmpty()
    @MinLength(3)
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    password!:string;

    @IsNotEmpty()
    @IsPhoneNumber('MZ')
    contato!:string;
}