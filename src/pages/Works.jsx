import './Works.css';

const WORKS = [
  {
    id: 1,
    title: '墨迹日历',
    desc: '一款极简风格的桌面日历应用，黑白水墨质感，专注于当下这一天。',
    tags: ['React', 'Electron'],
    link: '#',
  },
  {
    id: 2,
    title: '字行间',
    desc: '排版实验项目，探索中文长文在 Web 上的阅读体验优化。',
    tags: ['CSS', '排版'],
    link: '#',
  },
  {
    id: 3,
    title: '留白图床',
    desc: '个人图片托管服务，界面克制，专注存储与分享。',
    tags: ['Node.js', 'S3'],
    link: '#',
  },
  {
    id: 4,
    title: '晨读摘录',
    desc: '每日摘录一段话，用 RSS 推送给订阅者，坚持了三年。',
    tags: ['RSS', '内容'],
    link: '#',
  },
];

export default function Works() {
  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>
      <section className="section">
        <div className="container">
          <p style={{ letterSpacing: '0.15em', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>WORKS</p>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>作品集</h2>
          <span className="divider" />
          <p style={{ marginBottom: 'var(--space-lg)' }}>
            一些做过的东西，有的已经上线，有的还在抽屉里。
          </p>

          <div className="works__grid">
            {WORKS.map((w) => (
              <article key={w.id} className="work-card">
                <div className="work-card__tags">
                  {w.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <h3 className="work-card__title">{w.title}</h3>
                <p className="work-card__desc">{w.desc}</p>
                {w.link && (
                  <a href={w.link} className="work-card__link btn" target="_blank" rel="noreferrer">
                    查看项目 →
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
