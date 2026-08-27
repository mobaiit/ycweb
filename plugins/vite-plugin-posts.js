/**
 * vite-plugin-posts.js
 *
 * 虚拟模块（所有解析在 Node 侧完成，浏览器侧不引入 gray-matter）：
 *
 *   import posts from 'virtual:posts'
 *     → 按日期倒序的文章 meta 列表（title/date/tags/excerpt/slug）
 *
 *   import { meta, content } from 'virtual:post/<slug>'
 *     → meta: frontmatter 对象；content: 去掉 frontmatter 后的正文字符串
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
const VIRTUAL_POST_PREFIX   = 'virtual:post/';
const RESOLVED_LIST         = '\0virtual:posts';
const RESOLVED_POST_PREFIX  = '\0virtual:post/';

/** 读取全部文章 meta，按日期倒序 */
function loadMetas() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
      const { data } = matter(raw);
      const slug = filename.replace(/\.md$/, '');
      const dateFromName = filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      return {
        slug,
        title:   data.title   ?? slug,
        date:    data.date    ? String(data.date).slice(0, 10) : (dateFromName ?? ''),
        tags:    data.tags    ?? [],
        excerpt: data.excerpt ?? '',
      };
    })
    .filter((p) => p.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 读取单篇，返回 { meta, content } */
function loadPost(slug) {
  const filepath = path.join(POSTS_DIR, slug + '.md');
  if (!fs.existsSync(filepath)) return null;
  const { data, content } = matter(fs.readFileSync(filepath, 'utf-8'));
  const dateFromName = slug.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const meta = {
    slug,
    title:   data.title   ?? slug,
    date:    data.date    ? String(data.date).slice(0, 10) : (dateFromName ?? ''),
    tags:    data.tags    ?? [],
    excerpt: data.excerpt ?? '',
  };
  return { meta, content };
}

export default function postsPlugin() {
  return {
    name: 'vite-plugin-posts',

    resolveId(id) {
      if (id === VIRTUAL_LIST) return RESOLVED_LIST;
      if (id.startsWith(VIRTUAL_POST_PREFIX))
        return RESOLVED_POST_PREFIX + id.slice(VIRTUAL_POST_PREFIX.length);
    },

    load(id) {
      if (id === RESOLVED_LIST) {
        return `export default ${JSON.stringify(loadMetas(), null, 2)};`;
      }

      if (id.startsWith(RESOLVED_POST_PREFIX)) {
        const slug = id.slice(RESOLVED_POST_PREFIX.length);
        const post = loadPost(slug);
        if (!post) throw new Error(`[vite-plugin-posts] 找不到文章：${slug}`);
        // 导出已解析的 meta 和纯正文字符串，不含 frontmatter
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
        // 使列表模块失效
        const listMod = server.moduleGraph.getModuleById(RESOLVED_LIST);
        if (listMod) server.moduleGraph.invalidateModule(listMod);
        // 使对应文章模块失效
        const slug = path.basename(file, '.md');
        const postMod = server.moduleGraph.getModuleById(RESOLVED_POST_PREFIX + slug);
        if (postMod) server.moduleGraph.invalidateModule(postMod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
