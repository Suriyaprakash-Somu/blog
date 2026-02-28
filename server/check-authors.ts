import { db } from './src/db/index.js';
import { blogPosts } from './src/modules/blogPosts/blogPosts.schema.js';
import { platformUser } from './src/modules/users/platform/platform.schema.js';

async function check() {
  const posts = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    authorId: blogPosts.authorId,
    status: blogPosts.status
  }).from(blogPosts);
  
  console.log("Blog Posts Data:");
  console.table(posts);

  const users = await db.select({
    id: platformUser.id,
    name: platformUser.name,
    email: platformUser.email
  }).from(platformUser);

  console.log("\nPlatform Users Data:");
  console.table(users);

  process.exit(0);
}

check().catch(console.error);
