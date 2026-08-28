import Comments from '../components/Comments';
import './About.css';

const SKILLS = [
  'Java', 'Spring Cloud', '微服务', 'Docker', 'Kubernetes',
  'AI Agent', 'Python', 'HTML5', '系统架构', '随笔写作',
];

export default function About() {
  return (
    <main style={{ paddingTop: 'var(--nav-height)' }}>
      <section className="section">
        <div className="container">
          <p className="hero__eyebrow" style={{ letterSpacing: '0.15em', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>ABOUT</p>
          <span className="divider" />

          <div className="about__grid">
            {/* 头像 */}
            <img 
              src="/images/luomoliubai.jpg" 
              alt="落墨留白"
              className="about__avatar"
            />

            <div className="about__content">
              <h2>LURI</h2>
              <p>
                敲了八年后端代码，主要用 Java。
                平时工作是拆系统、调性能、填别人挖的坑。
              </p>
              <p>
                微服务、分布式、容器化这些做得多了，偶尔也碰 AI 相关的东西，
                算是跟着行业走。
              </p>
              <p>
                业余时间写写博客，记一些不想忘掉的事。
                技术的、生活的都有，没有固定主题。
              </p>
              <p>
                联系邮箱：
                <a href="mailto:yuchenwd@gmail.com" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  yuchenwd@gmail.com
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Comments />
        </div>
      </section>
    </main>
  );
}
