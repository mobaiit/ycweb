import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import postsMap from 'virtual:posts-map';
import Comments from '../components/Comments';
import './PostDetail.css';

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function calculateReadingStats(content) {
  if (!content) return { wordCount: 0, readingTime: 0 };
  
  // 移除 markdown 标记和代码块
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/`[^`]*`/g, '') // 行内代码
    .replace(/[#*_\[\]()]/g, '') // markdown 符号
    .replace(/\s+/g, ''); // 空白字符
  
  const wordCount = plainText.length;
  const readingTime = Math.ceil(wordCount / 400); // 中文阅读速度约 400 字/分钟
  
  return { wordCount, readingTime };
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollable = documentHeight - windowHeight;
      const scrolled = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="reading-progress" style={{ width: `${progress}%` }} />
  );
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

  const { meta, content, prev, next } = post;
  const { wordCount, readingTime } = calculateReadingStats(content);

  return (
    <main className="post">
      <ReadingProgress />
      <div className="container">
        <header className="post__header">
          <Link to="/blog" className="post__back">← 随笔</Link>

          <div className="post__eyebrow">
            <time>{formatDate(meta.date)}</time>
            <span>·</span>
            <span>{wordCount.toLocaleString()} 字</span>
            <span>·</span>
            <span>{readingTime} 分钟阅读</span>
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
                <Link 
                  key={t} 
                  to={`/blog?tag=${encodeURIComponent(t)}`}
                  className="tag"
                >
                  {t}
                </Link>
              ))}
            </footer>
          )}
        </article>

        <nav className="post__nav">
          {prev && (
            <Link to={`/blog/${prev.slug}`} className="post__nav-item post__nav-item--prev">
              <span className="post__nav-label">← 上一篇</span>
              <span className="post__nav-title">{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link to={`/blog/${next.slug}`} className="post__nav-item post__nav-item--next">
              <span className="post__nav-label">下一篇 →</span>
              <span className="post__nav-title">{next.title}</span>
            </Link>
          )}
        </nav>

        <Comments />
      </div>
    </main>
  );
}
