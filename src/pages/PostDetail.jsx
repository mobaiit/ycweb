import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import postsMap from 'virtual:posts-map';
import './PostDetail.css';

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export default function PostDetail() {
  const { slug } = useParams();
  const post = postsMap[slug]; // 构建时已内联，同步查找

  if (!post) {
    return (
      <main className="post">
        <div className="container post__state">
          <p>文章不存在，或者已经搬家了。</p>
          <Link to="/blog" className="btn" style={{ marginTop: '1rem' }}>← 返回随笔</Link>
        </div>
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
