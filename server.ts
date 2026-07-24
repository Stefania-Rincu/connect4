import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initWebSocketServer } from "./app/lib/wsManager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port, customServer: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  initWebSocketServer(server, () => app.getUpgradeHandler());

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
