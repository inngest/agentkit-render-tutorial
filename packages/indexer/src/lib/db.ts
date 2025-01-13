import { Client } from "pg";
import { OpenAI } from "openai";
import { Story } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  await client.end();
  console.log("Disconnected from database");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
}

export async function storeStory(story: Story): Promise<void> {
  // Check if story already exists
  const existingStory = await client.query(
    "SELECT id FROM stories WHERE title = $1 AND date = $2::date",
    [story.title, story.date]
  );

  if (existingStory.rows.length > 0) {
    console.log(`Story "${story.title}" already exists, skipping...`);
    return;
  }

  // Generate embedding from title and content
  const embedding = await generateEmbedding(`${story.title} ${story.content}`);

  // Insert new story
  await client.query(
    "INSERT INTO stories (title, content, date, comments, embedding, interest_id) VALUES ($1, $2, $3::date, $4, $5::vector, $6)",
    [
      story.title,
      story.content,
      story.date,
      story.comments,
      `[${embedding.join(",")}]`,
      story.interest_id,
    ]
  );

  console.log(`Stored story: "${story.title}"`);
}

export async function storeStories(stories: Story[]): Promise<void> {
  for (const story of stories) {
    await storeStory(story);
  }
}

interface Interest {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export async function getInterests(): Promise<Interest[]> {
  const result = await client.query<Interest>("SELECT * FROM interests");
  return result.rows;
}
