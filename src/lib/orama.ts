import { create, insert, search, type AnyOrama, remove } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "@/server/db";
import type { OramaEmail } from "@/types";
import { getEmbeddings } from "./embeddings";

export class OramaClient {
  private orama!: AnyOrama;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  async initialize() {
    const account = await db.account.findUnique({
      where: { id: this.accountId },
      select: { oramaIndex: true },
    });

    if (!account) throw new Error("Account not found");

    if (account.oramaIndex) {
      this.orama = await restore("json", account.oramaIndex as string);
    } else {
      this.orama = create({
        schema: {
          id: "string",
          subject: "string",
          body: "string",
          //   rawBody: "string",
          from: "string",
          to: "string[]",
          sentAt: "string",
          embeddings: "vector[1536]",
          threadId: "string",
        },
      });
      await this.saveIndex();
    }
  }

  async insert(document: OramaEmail) {
    await insert(this.orama, document);
    await this.saveIndex();
  }

  async vectorSearch({
    prompt,
    numResults = 10,
  }: {
    prompt: string;
    numResults?: number;
  }) {
    const embeddings = await getEmbeddings(prompt);
    const results = await search(this.orama, {
      mode: "hybrid",
      term: prompt,
      vector: {
        value: embeddings,
        property: "embeddings",
      },
      similarity: 0.8,
      limit: numResults,
    });
    // console.log(results.hits.map(hit => hit.document))
    return results;
  }
  async search({ term }: { term: string }) {
    return await search(this.orama, {
      term,
      tolerance: 1,
    });
  }

  async saveIndex() {
    const index = await persist(this.orama, "json");
    await db.account.update({
      where: { id: this.accountId },
      data: { oramaIndex: index as Buffer },
    });
  }

  async removeThread(threadId: string) {
    const results = await search(this.orama, {
      term: threadId,
      properties: ["threadId"],
      tolerance: 0,
    });

    for (const hit of results.hits) {
      const id = hit.document.id;
      if (id) {
        await remove(this.orama, id);
      }
    }

    await this.saveIndex();
  }
}
