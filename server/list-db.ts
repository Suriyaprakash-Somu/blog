import 'dotenv/config';
import { db } from './src/db/index.js';
import { blogCategories } from './src/modules/blogCategories/blogCategories.schema.js';
import { blogTags } from './src/modules/blogTags/blogTags.schema.js';

async function main() {
  const cats = await db.select().from(blogCategories);
  const tags = await db.select().from(blogTags);
  console.log('Categories:', JSON.stringify(cats, null, 2));
  console.log('Tags:', JSON.stringify(tags, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
