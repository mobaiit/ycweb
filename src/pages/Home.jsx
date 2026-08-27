import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <section className="hero">
      <div className="container">
        <p className="hero__eyebrow">PERSONAL SITE</p>
        <h1 className="hero__title">
          你好，我是<em>落墨留白</em>。
        </h1>
        <p className="hero__sub">
          用文字记录思考，以代码构建世界。喜欢简单的事物，相信留白是一种表达。
        </p>
        <div className="hero__actions">
          <Link to="/works" className="btn btn--solid">查看作品</Link>
          <Link to="/about" className="btn">了解我</Link>
        </div>
      </div>

      {/* 滚动提示箭头 */}
      <span className="hero__scroll-hint" aria-hidden="true">SCROLL</span>
    </section>
  );
}
