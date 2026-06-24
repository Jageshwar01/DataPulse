import { pool } from '../db';
import fs from 'fs';
import path from 'path';

async function setup() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf-8');

    console.log('Running schema.sql...');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');

    console.log('Running seed.sql...');
    await pool.query(seedSql);
    console.log('Seed data inserted successfully.');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setup();
