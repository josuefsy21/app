import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.PORT || 8080;

async function startApp() {
  await runMigrations();

  app.listen(PORT);
}

startApp();

