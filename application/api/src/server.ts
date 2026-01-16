import { createApp } from "./app.js";
import { connectMongo } from "./infra/mongo.js";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectMongo();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

bootstrap();
