/**
 * vite-plugin-posts.js
 *
 * 虚拟模块（所有解析在 Node 侧完成，浏览器侧不引入 gray-matter）：
 *
 *   import posts from 'virtual:posts'
 *     → 按日期倒序的文章 meta 列表（title/date/tags/excerpt/slug）
 *
 *   import postsMap from 'virtual:posts-map'
 *     → 以 slug 为 key 的完整文章 Map：{ [slug]: { meta, content } }
 *       供 PostDetail 按 slug 直接查找，无需运行时动态 import
 *
 * 文件命名：src/posts/YYYY-MM-DD-slug.md
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.resolve(__dirname, '../src/posts');

const VIRTUAL_LIST          = 'virtual:posts';
const VIRTUAL_MAP           = 'virtual:posts-map';
const VIRTUAL_POST_PREFIX   = 'virtual:post/';
const RESOLVED_LIST         = '\0virtual:posts';
const RESOLVED_MAP          = '\0virtual:posts-map';
const RESOLVED_POST_PREFIX  = '\0virtual:post/';

/** 读取全部文章（meta + content），按日期倒序 */
function loadAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
      const { data, content } = matter(raw);
      const slug = filename.replace(/\.md$/, '');
      const dateFromName = filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      const meta = {
        slug,
        title:   data.title   ?? slug,
        date:    data.date    ? String(data.date).slice(0, 10) : (dateFromName ?? ''),
        tags:    data.tags    ?? [],
        excerpt: data.excerpt ?? '',
      };
      return { meta, content };
    })
    .filter((p) => p.meta.date)
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

export default function postsPlugin() {
  return {
    name: 'vite-plugin-posts',

    resolveId(id) {
      if (id === VIRTUAL_LIST) return RESOLVED_LIST;
      if (id === VIRTUAL_MAP)  return RESOLVED_MAP;
      if (id.startsWith(VIRTUAL_POST_PREFIX))
        return RESOLVED_POST_PREFIX + id.slice(VIRTUAL_POST_PREFIX.length);
    },

    load(id) {
      if (id === RESOLVED_LIST) {
        const metas = loadAllPosts().map((p) => p.meta);
        return `export default ${JSON.stringify(metas, null, 2)};`;
      }

      // 完整文章 Map：{ [slug]: { meta, content } }
      if (id === RESOLVED_MAP) {
        const all = loadAllPosts();
        const map = Object.fromEntries(all.map((p) => [p.meta.slug, p]));
        return `export default ${JSON.stringify(map)};`;
      }

      if (id.startsWith(RESOLVED_POST_PREFIX)) {
        const slug = id.slice(RESOLVED_POST_PREFIX.length);
        const all = loadAllPosts();
        const post = all.find((p) => p.meta.slug === slug);
        if (!post) throw new Error(`[vite-plugin-posts] 找不到文章：${slug}`);
        return [
          `export const meta = ${JSON.stringify(post.meta)};`,
          `export const content = ${JSON.stringify(post.content)};`,
        ].join('\n');
      }
    },

    // dev 模式热更新
    configureServer(server) {
      if (!fs.existsSync(POSTS_DIR)) return;
      server.watcher.add(POSTS_DIR);
      server.watcher.on('all', (event, file) => {
        if (!file.startsWith(POSTS_DIR) || !file.endsWith('.md')) return;
        const listMod = server.moduleGraph.getModuleById(RESOLVED_LIST);
        if (listMod) server.moduleGraph.invalidateModule(listMod);
        const mapMod = server.moduleGraph.getModuleById(RESOLVED_MAP);
        if (mapMod) server.moduleGraph.invalidateModule(mapMod);
        const slug = path.basename(file, '.md');
        const postMod = server.moduleGraph.getModuleById(RESOLVED_POST_PREFIX + slug);
        if (postMod) server.moduleGraph.invalidateModule(postMod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
