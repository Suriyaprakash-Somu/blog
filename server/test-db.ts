import { db } from './src/db/index.js';
import { blogCategories } from './src/modules/blogCategories/blogCategories.schema.js';

async function check() {
  const res = await db.select().from(blogCategories);
  console.log("Found Categories: ", JSON.stringify(res, null, 2));
  process.exit(0);
}

check().catch(console.error);
