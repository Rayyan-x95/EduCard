import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // If there's a hash, smooth scroll to the section
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); // small delay to ensure rendering
      }
    } else {
      // If no hash, scroll instantly to top when pathname changes
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname, hash]);

  return null;
};
