var liveChat = [];

// ========== MORE PAGE ==========
Router.register("more", function() {
  var h = '<div class="sh"><h2>More</h2></div>';
  var links = [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 20h5v-2a3 3 0 00-4-4H6a3 3 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>', label:"Members", page:"members"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', label:"Challenges", page:"challenges"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', label:"Scramble Teams", page:"scramble"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22V2"/><path d="M12 2l8 4-8 4"/><circle cx="12" cy="22" r="2"/></svg>', label:"Tee Times", page:"teetimes"}
  ];
  h += '<div style="padding:8px 16px">';
  links.forEach(function(l) {
    h += '<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="Router.go(\'' + l.page + '\')">';
    h += '<div style="padding:14px 16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="color:var(--muted);flex-shrink:0">' + l.icon + '</div>';
    h += '<div style="font-size:14px;font-weight:500;color:var(--cream)">' + l.label + '</div>';
    h += '<div style="margin-left:auto;color:var(--muted2)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>';
    h += '</div></div>';
  });
  h += '</div>';
  document.querySelector('[data-page="more"]').innerHTML = h;
});

// ========== COMBINED FEED ==========
