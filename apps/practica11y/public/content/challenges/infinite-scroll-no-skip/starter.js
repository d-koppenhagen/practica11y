const articles = [
  { title: 'Semantic HTML Basics', summary: 'Why semantic elements matter for accessibility and SEO.' },
  { title: 'Color Contrast Explained', summary: 'How to ensure your text is readable by everyone.' },
  { title: 'Keyboard Navigation 101', summary: 'Make your site fully operable without a mouse.' },
  { title: 'ARIA Roles Demystified', summary: 'When and how to use ARIA to enhance accessibility.' },
  { title: 'Responsive Design Patterns', summary: 'Build layouts that work on any screen size.' },
  { title: 'Testing with Screen Readers', summary: 'A practical guide to testing with NVDA and VoiceOver.' },
];

let articleIndex = 0;

function loadMoreArticles() {
  const feed = document.getElementById('feed');
  const loading = document.getElementById('loading');

  loading.hidden = false;

  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const data = articles[articleIndex % articles.length];
      articleIndex++;

      const article = document.createElement('article');
      article.className = 'card';
      article.innerHTML = `
        <h2>${data.title}</h2>
        <p>${data.summary}</p>
        <a href="#">Read more</a>
      `;
      feed.appendChild(article);
    }
    loading.hidden = true;
  }, 500);
}

// Auto-load more articles when scrolling near the bottom
window.addEventListener('scroll', () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = document.body.offsetHeight - 200;

  if (scrollPosition >= threshold) {
    loadMoreArticles();
  }
});
