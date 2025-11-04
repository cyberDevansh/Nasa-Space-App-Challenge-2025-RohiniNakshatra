(function(){
  function setActiveLink() {
    var path = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-links a[data-page]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.getAttribute('data-page') === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  }

  function initScrollNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', function(){
      if (window.scrollY > 100) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  window.navigationManager = {
    init: function(){
      setActiveLink();
      initScrollNav();
    }
  };

  // Auto-init if nav already present in DOM
  if (document.getElementById('nav')) {
    window.navigationManager.init();
  }
})();


