import { Link } from 'react-router-dom';
import './Home.css';

/**
 * 把字符串拆成逐字 <span>，每个字附带交错延迟
 * baseDelay: 整组动画的起始延迟（秒）
 * stagger: 每字之间的间隔（秒）
 */
function SplitText({ text, baseDelay = 0.2, stagger = 0.04, className = '' }) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          className={`char ${className}`}
          style={{ animationDelay: `${baseDelay + i * stagger}s` }}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  const line1 = '你好，我是';
  const line2 = '落墨留白';
  const suffix = '。';
  const charCount1 = [...line1].length;

  return (
    <section className="hero">
      <div className="container">
        <p className="hero__eyebrow" aria-label="PERSONAL SITE">PERSONAL SITE</p>

        {/* 方向二：标题逐字淡入 */}
        <h1 className="hero__title" aria-label={`${line1}${line2}${suffix}`}>
          <SplitText text={line1} baseDelay={0.25} stagger={0.05} />
          <em>
            <SplitText text={line2} baseDelay={0.25 + charCount1 * 0.05} stagger={0.06} />
          </em>
          <SplitText
            text={suffix}
            baseDelay={0.25 + charCount1 * 0.05 + [...line2].length * 0.06}
            stagger={0}
          />
        </h1>

        <p className="hero__sub">
          用文字记录思考，以代码构建世界。喜欢简单的事物，相信留白是一种表达。
        </p>

        <div className="hero__actions">
          <Link to="/blog" className="btn">
            <span>查看随笔</span>
          </Link>
          <Link to="/about" className="btn">
            <span>了解我</span>
          </Link>
        </div>
      </div>

      <span className="hero__scroll-hint" aria-hidden="true">SCROLL</span>
    </section>
  );
}
