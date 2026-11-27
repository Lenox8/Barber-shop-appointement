import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js'
import { userDto } from './dto/users.dto.js'
import * as bcrypt from 'bcrypt'
import { IsNumber } from 'class-validator';

// all users
export interface usersAll {
    id: string;
    username: string;
    contato: string;
    created_at: string;
    updated_at: string;
}

// new user
export interface userCreation {
    id: string;
    email: string;
    username: string;
    contato: string;
}

export interface userIdResponse {
    id: string;
}


@Injectable()
export class UsersService {

    constructor(private readonly database: SupabaseService) {}

    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase()
    }   
     // get user by ID
    async findUser (email: string) {
        const norEmail = this.normalizeEmail(email)
        try {
            const rEmail = await this.database.client`
            SELECT * FROM users WHERE email = ${norEmail} LIMIT 1
            `;
            return rEmail[0] ?? null
        } catch (error) {
            throw new Error(`Error while searching for user: ${(error as Error).message}`)
        }
    }
    // get all users from DB
    async getAllUsers (): Promise<usersAll[]> {
       try {
        const users = await this.database.client<usersAll[]>`
        SELECT * FROM users ORDER BY id ASC
        `
        return users
       } catch (error) {
        console.log("An error occured while fetching data from the database", error)
        throw new InternalServerErrorException()
       }
    }
    // get timezone user
    async getUserTimezone(userId: string): Promise<string> {
        const [user] = await this.database.client`
        SELECT timezone 
        FROM users
        WHERE id = ${userId}
        `
        if (!user) {
            throw new NotFoundException('user not found')
        }
        return user.timezone ?? 'Africa/Maputo'
    }

    // getUser ID
    async getUserId(id: string) {
        try {
            const [userId] = await this.database.client`
            SELECT * FROM users WHERE id = ${id} LIMIT 1
            `
            if (!userId) {
                throw new NotFoundException()
            }
            return userId
        } catch (error) {
            
        }
    }

    // add new user to the db
    async newUser (dto: userDto): Promise<userCreation> {
        const normalizeE =  this.normalizeEmail(dto.email)
        const normalizeU = dto.username.trim()
        // hash password
        let saltRounds = 10
        const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
        try {
            const [utilizadorNovo] = await this.database.client<userCreation[]>`
            INSERT INTO users(
            username,
            email,
            password,
            contato
            )
            VALUES (
            ${normalizeU},
            ${normalizeE},
            ${hashedPassword},
            ${dto.contato}
            )
            RETURNING
            id,
            username,
            email,
            contato,
            created_at,
            updated_at
            `
            return utilizadorNovo;

        } catch (error) {
            console.log("An error occured while adding data to the database", error)
            throw new InternalServerErrorException()
        }
    }
}
