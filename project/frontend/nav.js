// Small nav helper to sync theme between SPA and static pages
(function(){
  function applyTheme(theme){
    document.body.classList.remove('lunar-theme','solaris-theme')
    if(theme==='lunar') document.body.classList.add('lunar-theme')
    if(theme==='solaris') document.body.classList.add('solaris-theme')
    const btn = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn')
    if(btn) btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1)
  }

  window.addEventListener('themeChanged', function(e){
    const t = e.detail && e.detail.theme ? e.detail.theme : null
    if(t) applyTheme(t)
  })

  // initialize
  const cur = localStorage.getItem('theme') || 'cosmos'
  applyTheme(cur)

  // expose a small navigation manager if needed
  window.navigationManager = {
    init: function(){/* placeholder */}
  }
})();
