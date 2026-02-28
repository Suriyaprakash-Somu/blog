import { db } from './src/db/index.js';
import { blogPosts } from './src/modules/blogPosts/blogPosts.schema.js';
import { platformUser } from './src/modules/users/platform/platform.schema.js';
import { isNull, eq } from 'drizzle-orm';

async function fix() {
  // Get the first platform user (Owner)
  const [owner] = await db.select({ id: platformUser.id }).from(platformUser).limit(1);
  
  if (!owner) {
    console.error("No platform users found. Cannot fix authors.");
    process.exit(1);
  }

  console.log(`Assigning null authors to user: ${owner.id}`);

  const result = await db
    .update(blogPosts)
    .set({ 
      authorId: owner.id,
      authorType: 'platform'
    })
    .where(isNull(blogPosts.authorId));

  console.log(`Fix complete.`);
  process.exit(0);
}

fix().catch(console.error);
