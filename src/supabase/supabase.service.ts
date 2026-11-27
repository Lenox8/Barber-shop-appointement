import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres, { Sql } from 'postgres';

@Injectable()
export class SupabaseService {
    private readonly sql: Sql;

    constructor(private readonly configService: ConfigService) {
        const connectionString = this.configService.getOrThrow<string>('SUPABASE_URL');

        this.sql = postgres(connectionString);
    }

    get client() : Sql {
        return this.sql;
    }
}