/**
 * API client for article operations
 */

// Request/Response types matching the Cloudflare Worker API
export interface CreateArticleRequest {
  source_type: "url" | "email";
  source_url?: string;
  email_message_id?: string;
  raw_content: string;
  title?: string;
}

export interface ArticleResponse {
  id: string;
  title: string;
  ai_summary: string;
  ai_enhanced_content: string;
  raw_content: string;
  language: string;
  reading_time: number;
  status: string;
  created_at: string;
  url: string;
  source_url?: string;
  author?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Get the base URL for API requests
 * Works for both local development and production
 */
function getBaseUrl(): string {
  // In browser environment
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // In server environment (SSR/SSG)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback for development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production fallback (will use relative URLs)
  return "";
}

/**
 * Create a new article or retrieve existing one from cache
 *
 * POST /api/article
 *
 * @param data - Article creation request data
 * @returns Article response or throws error
 */
export async function createArticle(
  data: CreateArticleRequest
): Promise<ArticleResponse> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/article`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || error.error || "Failed to create article");
    }

    const article: ArticleResponse = await response.json();
    return article;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while creating the article");
  }
}

/**
 * Retrieve an existing article by ID
 *
 * GET /api/article/:id
 *
 * @param id - Article ID (SHA-256 hash)
 * @returns Article response or throws error
 */
export async function getArticle(id: string): Promise<ArticleResponse> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/article/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Article not found");
      }
      const error: ApiError = await response.json();
      throw new Error(error.message || error.error || "Failed to retrieve article");
    }

    const article: ArticleResponse = await response.json();
    return article;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while retrieving the article");
  }
}
