import './Footer.css';

const SOCIAL = [
  {
    label: 'GitHub',
    href: 'https://github.com/mobaiit',
    iconId: 'github-icon',
  },
  {
    label: 'QQ: 37010871',
    href: 'tencent://message/?uin=37010871',
    iconId: 'qq-icon',
  },
  { label: 'RSS', href: '/rss.xml' },
];

function Icon({ id }) {
  return (
    <svg className="footer__icon" aria-hidden="true">
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__copy">© {year} 落墨留白 · 用心留白</p>
        <ul className="footer__links">
          {SOCIAL.map(({ label, href, iconId }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer">
                {iconId && <Icon id={iconId} />}
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
