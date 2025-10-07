// Simple helpers used across pages
function go(url){ window.location.href = url; }
function toast(msg, cls=''){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.className=cls; }
