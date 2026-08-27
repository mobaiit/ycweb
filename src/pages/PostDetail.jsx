import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './PostDetail.css';

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);  // { meta, content }
  const [error, setError] = useState(false);

  useEffect(() => {
    setPost(null);
    setError(false);

    // 插件在构建时已将 frontmatter 解析完毕，
    // 浏览器只拿到 meta 对象和纯正文字符串，无需引入 gray-matter
    import(/* @vite-ignore */ `virtual:post/${slug}`)
      .then((mod) => setPost({ meta: mod.meta, content: mod.content }))
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <main className="post">
        <div className="container post__state">
          <p>文章不存在，或者已经搬家了。</p>
          <Link to="/blog" className="btn" style={{ marginTop: '1rem' }}>← 返回随笔</Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="post">
        <div className="container post__state">加载中…</div>
      </main>
    );
  }

  const { meta, content } = post;

  return (
    <main className="post">
      <div className="container">
        <header className="post__header">
          <Link to="/blog" className="post__back">← 随笔</Link>

          <div className="post__eyebrow">
            <time>{formatDate(meta.date)}</time>
            {meta.tags?.length > 0 && (
              <>
                <span>·</span>
                <span>{meta.tags.join(' / ')}</span>
              </>
            )}
          </div>

          <h1 className="post__title">{meta.title}</h1>

          {meta.excerpt && (
            <p className="post__excerpt">{meta.excerpt}</p>
          )}
        </header>

        <article className="post__body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>

          {meta.tags?.length > 0 && (
            <footer className="post__footer">
              <span className="post__footer-label">标签：</span>
              {meta.tags.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </footer>
          )}
        </article>
      </div>
    </main>
  );
}
