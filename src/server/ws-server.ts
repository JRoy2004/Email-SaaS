/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/server/ws-server.ts
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws"; // ✅ This is correct
import type { WebSocket } from "ws";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";

const wss = new WebSocketServer({
  port: 3001,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createTRPCContext,
});

console.log("✅ WebSocket server listening on ws://localhost:3001");

wss.on("connection", (ws: WebSocket) => {
  console.log("➕ Client connected");

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});
