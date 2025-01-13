import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export interface Interest {
  id: number;
  name: string;
  email: string;
}

export interface Question {
  id: number;
  interest_id: number;
  question: string;
  frequency: string;
}

export async function getInterests(): Promise<Interest[]> {
  const result = await pool.query(
    "SELECT * FROM interests ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function createInterest(
  name: string,
  email: string
): Promise<Interest> {
  const result = await pool.query(
    "INSERT INTO interests (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  return result.rows[0];
}

export async function deleteInterest(id: number): Promise<void> {
  await pool.query("DELETE FROM interests WHERE id = $1", [id]);
}

export async function getQuestions(): Promise<Question[]> {
  const result = await pool.query(
    "SELECT * FROM questions ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function createQuestion(
  interest_id: number,
  question: string,
  frequency: string
): Promise<Question> {
  const result = await pool.query(
    "INSERT INTO questions (interest_id, question, frequency) VALUES ($1, $2, $3) RETURNING *",
    [interest_id, question, frequency]
  );
  return result.rows[0];
}

export async function deleteQuestion(id: number): Promise<void> {
  await pool.query("DELETE FROM questions WHERE id = $1", [id]);
}
