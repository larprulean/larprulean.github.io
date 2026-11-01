// Pop "still here?" in whenever the bottom of the page scrolls into view
const end = document.querySelector('.end');
if (end && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    end.classList.toggle('in', entry.isIntersecting);
  }, { threshold: 0.5 }).observe(end);
} else if (end) {
  end.classList.add('in');
}

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
