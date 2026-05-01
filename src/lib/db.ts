import { openDB, type IDBPDatabase } from "idb";
import type { StoredPage } from "@/types/messages";

const DB_NAME = "tabmemory-v1";
const DB_VERSION = 3;
const STORE = "pages";

type TabMemoryDB = {
  pages: {
    key: string;
    value: StoredPage;
    indexes: {
      "by-url": string;
      "by-timestamp": number;
    };
  };
};

let _db: IDBPDatabase<TabMemoryDB> | null = null;

async function getDb(): Promise<IDBPDatabase<TabMemoryDB>> {
  if (_db) return _db;

  _db = await openDB<TabMemoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 3 && db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-url", "url", { unique: true });
        store.createIndex("by-timestamp", "timestamp");
      }
    },
  });

  return _db;
}

export const db = {
  async savePage(page: StoredPage): Promise<void> {
    const database = await getDb();
    await database.put(STORE, page);
  },

  async getByUrl(url: string): Promise<StoredPage | undefined> {
    const database = await getDb();
    return database.getFromIndex(STORE, "by-url", url);
  },

  async getAllPages(): Promise<StoredPage[]> {
    const database = await getDb();
    return database.getAll(STORE);
  },

  async getRecentPages(limit = 20): Promise<StoredPage[]> {
    const database = await getDb();
    const tx = database.transaction(STORE, "readonly");
    const index = tx.store.index("by-timestamp");

    const pages: StoredPage[] = [];
    let cursor = await index.openCursor(null, "prev"); // newest first

    while (cursor && pages.length < limit) {
      pages.push(cursor.value);
      cursor = await cursor.continue();
    }

    return pages;
  },

  async deletePage(id: string): Promise<void> {
    const database = await getDb();
    await database.delete(STORE, id);
  },

  async evictOldest(maxPages: number): Promise<void> {
    const database = await getDb();
    const count = await database.count(STORE);
    if (count <= maxPages) return;

    const tx = database.transaction(STORE, "readwrite");
    const index = tx.store.index("by-timestamp");
    let cursor = await index.openCursor(null, "next"); // oldest first
    let toDelete = count - maxPages;

    while (cursor && toDelete > 0) {
      await cursor.delete();
      cursor = await cursor.continue();
      toDelete--;
    }
    await tx.done;
  },

  async clearAll(): Promise<void> {
    const database = await getDb();
    await database.clear(STORE);
  },

  async getStats(): Promise<{ totalPages: number; oldestPage: number | null }> {
    const database = await getDb();
    const count = await database.count(STORE);

    if (count === 0) return { totalPages: 0, oldestPage: null };

    // Get oldest entry via timestamp index
    const tx = database.transaction(STORE, "readonly");
    const index = tx.store.index("by-timestamp");
    const cursor = await index.openCursor(null, "next"); // oldest first
    const oldestPage = cursor?.value.timestamp ?? null;

    return { totalPages: count, oldestPage };
  },
};
