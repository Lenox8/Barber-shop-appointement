import { IsDate, IsMilitaryTime, IsNotEmpty, IsOptional, IsString, IsTimeZone, IsUUID } from "class-validator";

export class agendarCorteDto {
    @IsMilitaryTime()
    scheduled_at!: string;

    @IsNotEmpty()
    @IsString()
    cut_id!: string;

    @IsNotEmpty()
    @IsString()
    @IsUUID()
    barber_id!: string;

}