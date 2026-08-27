import './Footer.css';

const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/' },
  { label: '微博', href: '#' },
  { label: 'RSS', href: '/rss.xml' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__copy">© {year} 落墨留白 · 用心留白</p>
        <ul className="footer__links">
          {SOCIAL.map(({ label, href }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer">{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
