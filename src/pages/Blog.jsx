import { Link } from 'react-router-dom';
import './Blog.css';

const POSTS = [
  {
    id: 1,
    date: '2026-08-20',
    title: '留白的力量',
    excerpt: '极简主义不是减法，而是关于什么值得保留的判断。',
    tags: ['设计', '思考'],
    slug: '#',
  },
  {
    id: 2,
    date: '2026-07-15',
    title: '一个人的咖啡馆',
    excerpt: '每天早晨六点，我在同一张桌子坐下来，打开电脑之前先把窗帘拉开一半。',
    tags: ['生活'],
    slug: '#',
  },
  {
    id: 3,
    date: '2026-06-03',
    title: '为什么我开始用黑白摄影',
    excerpt: '去掉颜色之后，你才发现光和阴影才是构图的核心。',
    tags: ['摄影', '随想'],
    slug: '#',
  },
  {
    id: 4,
    date: '2026-05-10',
    title: '关于独立开发这一年',
    excerpt: '没有会议、没有 KPI，只有代码和沉默。我后悔了吗？没有。',
    tags: ['独立开发', '成长'],
    slug: '#',
  },
  {
    id: 5,
    date: '2026-04-01',
    title: '宋体、黑体与阅读心情',
    excerpt: '字体选择影响的不只是视觉，还有你读下去的欲望。',
    tags: ['排版', '设计'],
    slug: '#',
  },
];

function formatDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Blog() {
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

          <div className="blog__list">
            {POSTS.map((post) => (
              <Link key={post.id} to={post.slug} className="blog-item">
                <span className="blog-item__date">{formatDate(post.date)}</span>
                <div className="blog-item__right">
                  <span className="blog-item__title">{post.title}</span>
                  <span className="blog-item__excerpt">{post.excerpt}</span>
                  <div className="blog-item__tags">
                    {post.tags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
