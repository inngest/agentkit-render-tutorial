import { chromium } from "playwright-core";
import { Story } from "./types";

export const searchHackerNews = async (query: string): Promise<Story[]> => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to Algolia HN search
  await page.goto(
    "https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=&sort=byDate&type=story"
  );

  console.info("Success!");

  // Wait for search input field to be visible
  await page.waitForSelector(".SearchHeader_container input");

  // Type the topic into search field
  await page.locator(".SearchHeader_container input").first().fill(query);

  // Wait for stories to load
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.waitForSelector("article.Story");

  // Extract data from all story entries
  const stories = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("article.Story")).map(
      (story) => {
        // Get title
        const titleEl = story.querySelector(".Story_title span");
        const title = titleEl?.textContent || "";

        // Get content from comment section if it exists
        const contentEl = story.querySelector(".Story_comment span");
        const content = contentEl?.textContent || "";

        // Get date
        const dateEl = story.querySelector(".Story_meta span:nth-of-type(3)");
        const date = dateEl?.textContent || "";
        // Convert relative time to actual date
        const now = new Date();
        const match = date.match(
          /(\d+)\s+(minute|minutes|hour|hours|day|days|month|months|year|years)\s+ago/
        );

        let finalDate = now;
        if (match) {
          const [_, amount, unit] = match;
          const value = parseInt(amount);

          switch (unit) {
            case "minute":
            case "minutes":
              finalDate = new Date(now.getTime() - value * 60 * 1000);
              break;
            case "hour":
            case "hours":
              finalDate = new Date(now.getTime() - value * 60 * 60 * 1000);
              break;
            case "day":
            case "days":
              finalDate = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
              break;
            case "month":
            case "months":
              finalDate = new Date(
                now.getTime() - value * 30 * 24 * 60 * 60 * 1000
              );
              break;
            case "year":
            case "years":
              finalDate = new Date(
                now.getTime() - value * 365 * 24 * 60 * 60 * 1000
              );
              break;
          }
        }

        // Format date as MM/DD/YYYY to match existing format in database
        const formattedDate = `${
          finalDate.getMonth() + 1
        }/${finalDate.getDate()}/${finalDate.getFullYear()}`;

        // Get comment count
        const commentEl = story.querySelector(".Story_meta a:last-child");
        const comments = commentEl?.textContent || "0 comments";

        return {
          title,
          content,
          date: formattedDate,
          comments,
        };
      }
    );
  });

  await browser.close();

  return stories;
};
