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
                独立开发者 / 系统架构师。追求极致简洁的代码与系统的最优解。
                不迎合，不妥协，只写让自己满意的程序。
              </p>
              <p>
                昼伏夜出。凌晨两点是我大脑最清醒的时刻。
                桌上只有一杯冷萃黑咖啡，显示器里是未完成的架构重构。
              </p>
              <p>
                正在成为数字游民。带着装载所有内核的笔记本，
                在世界各地的海边或雪山，遥控云端服务器。
              </p>
              <p>
                技术合作或深度交流：
                <a href="mailto:yuchenwd@gmail.com" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  yuchenwd@gmail.com
                </a>
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                邮件结尾我只会写两个字：运行。
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
