const pages = {
  home: '<h1>Home</h1><p>Welcome to our website! Use the navigation above to explore the different pages.</p>',
  about:
    '<h1>About Us</h1><p>We are a small team dedicated to building accessible web experiences.</p>',
  contact:
    '<h1>Contact</h1><p>Email us at hello@example.com or call us at 555-0123.</p>',
};

function navigate(page) {
  const mainPageContent = document.getElementById('page-content');
  mainPageContent.innerHTML = pages[page];
  mainPageContent.focus();
}

document.getElementById('home-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('home');
});

document.getElementById('about-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('about');
});

document.getElementById('contact-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('contact');
});
