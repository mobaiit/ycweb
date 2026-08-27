import { Link } from 'react-router-dom';
import posts from 'virtual:posts';
import './Blog.css';

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 将文章列表按年份分组，返回 [{ year, posts }]，年份倒序 */
function groupByYear(postList) {
  const map = new Map();
  for (const post of postList) {
    const year = post.date.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(post);
  }
  return [...map.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, list]) => ({ year, posts: list }));
}

export default function Blog() {
  const groups = groupByYear(posts);

  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>
      <section className="section">
        <div className="container">
          <p style={{ letterSpacing: '0.15em', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>BLOG</p>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>随笔</h2>
          <span className="divider" />
          <p style={{ marginBottom: 'var(--space-lg)' }}>
            一些碎碎念，关于设计、生活、和正在思考的问题。
          </p>

          {/* 时间线：按年份分组 */}
          {groups.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>还没有文章，快去 src/posts/ 里写一篇吧。</p>
          ) : (
            groups.map(({ year, posts: yearPosts }) => (
              <div key={year} className="blog__year-group">
                <h3 className="blog__year">{year}</h3>
                <div className="blog__list">
                  {yearPosts.map((post) => (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-item">
                      <span className="blog-item__date">{formatDate(post.date)}</span>
                      <div className="blog-item__right">
                        <span className="blog-item__title">{post.title}</span>
                        {post.excerpt && (
                          <span className="blog-item__excerpt">{post.excerpt}</span>
                        )}
                        {post.tags?.length > 0 && (
                          <div className="blog-item__tags">
                            {post.tags.map((t) => (
                              <span key={t} className="tag">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
