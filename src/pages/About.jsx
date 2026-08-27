import './About.css';

const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'CSS / Sass',
  '摄影', '随笔写作', '平面设计', '咖啡',
];

export default function About() {
  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>
      <section className="section">
        <div className="container">
          <p className="hero__eyebrow" style={{ letterSpacing: '0.15em', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ABOUT</p>
          <span className="divider" />

          <div className="about__grid">
            {/* 头像占位 */}
            <div className="about__avatar-placeholder" aria-hidden="true">✦</div>

            <div className="about__content">
              <h2>落墨留白</h2>
              <p>
                独立开发者 / 文字工作者。热衷于探索技术与美学的交叉地带，
                相信好的设计应该像空气一样自然。
              </p>
              <p>
                平时喜欢拍照、读书、煮咖啡。偶尔在这里记录一些正在思考的事情，
                欢迎你停下来坐坐。
              </p>
              <p>
                如果有项目合作或只是想聊聊，随时可以给我写信：
                <a href="mailto:hello@example.com" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  hello@example.com
                </a>
              </p>

              <div className="about__skills">
                {SKILLS.map((s) => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
