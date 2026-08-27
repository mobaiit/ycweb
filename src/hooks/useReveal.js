/**
 * useReveal
 * 给目标元素绑定 IntersectionObserver，
 * 进入视口时添加 .is-visible，触发 CSS fade-up 动画。
 *
 * 用法：
 *   const ref = useReveal();
 *   <section ref={ref} className="reveal"> ... </section>
 *
 * 或批量观察子元素：
 *   const ref = useReveal({ selector: '.reveal-item', threshold: 0.15 });
 */
import { useEffect, useRef } from 'react';

export default function useReveal({
  selector   = null,   // 若传入 selector，观察容器内匹配的子元素
  threshold  = 0.12,
  rootMargin = '0px 0px -48px 0px',
  once       = true,   // 出现后不再重复触发
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = selector
      ? Array.from(root.querySelectorAll(selector))
      : [root];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector, threshold, rootMargin, once]);

  return ref;
}
