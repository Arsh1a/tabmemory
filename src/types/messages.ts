export type PageData = {
  url: string;
  title: string;
  text: string; // clean extracted text from Readability
  excerpt: string; // short preview snippet
  timestamp: number;
};

export type StoredPage = PageData & {
  id: string; // crypto.randomUUID()
  embeddings: number[][]; // one 384-dim vector per text chunk
};

export type SearchResult = Omit<StoredPage, "embeddings"> & {
  score: number; // cosine similarity 0-1
  snippet: string; // highlighted excerpt around matched context
};

export type Msg =
  | { type: "PAGE_EXTRACTED"; payload: PageData }
  | { type: "EMBED_PAGE"; payload: PageData }
  | { type: "EMBED_DONE"; payload: StoredPage }
  | { type: "EMBED_ERROR"; payload: { url: string; error: string } }
  | { type: "OFFSCREEN_READY" }
  | {
      type: "MODEL_PROGRESS";
      payload: {
        progress: number;
        file: string;
        loaded: number;
        total: number;
      };
    }
  | { type: "MODEL_READY" }
  | { type: "MODEL_ERROR"; payload: { message: string } }
  | { type: "GET_MODEL_STATE" }
  | { type: "PRELOAD_MODEL" }
  | { type: "RETRY_MODEL" }
  | {
      type: "INDEXING_UPDATE";
      payload: {
        current: { title: string; url: string } | null;
        queue: { title: string; url: string }[];
      };
    }
  | { type: "GET_INDEXING_STATE" }
  | { type: "EMBED_QUERY"; payload: { query: string; reqId: string } }
  | { type: "QUERY_EMBEDDING"; payload: { vector: number[]; reqId: string } }
  | { type: "SEARCH_QUERY"; payload: { query: string } }
  | { type: "SEARCH_RESULTS"; payload: SearchResult[] }
  | { type: "GET_STATS" }
  | {
      type: "STATS";
      payload: { totalPages: number; oldestPage: number | null };
    }
  | { type: "EXTRACT_PDF"; payload: { url: string; title: string } }
  | { type: "PDF_EXTRACTED"; payload: PageData }
  | { type: "PDF_EXTRACT_ERROR"; payload: { url: string; error: string } };
