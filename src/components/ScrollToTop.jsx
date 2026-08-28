import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 每次路由切换时将页面滚动到顶部，
 * 避免 SPA 场景下浏览器 scroll restoration 把上一页的位置带过来。
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
