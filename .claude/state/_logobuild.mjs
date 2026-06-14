import { chromium } from 'playwright';
const ROSE = `
  <g transform="translate(82 38)">
    <!-- 5-petal heraldic York rose -->
    <g fill="var(--rose,#F4EFE4)" stroke="var(--p,#2F4A3A)" stroke-width="2">
      <g><ellipse cx="0" cy="-12" rx="8.5" ry="11"/></g>
      <g transform="rotate(72)"><ellipse cx="0" cy="-12" rx="8.5" ry="11"/></g>
      <g transform="rotate(144)"><ellipse cx="0" cy="-12" rx="8.5" ry="11"/></g>
      <g transform="rotate(216)"><ellipse cx="0" cy="-12" rx="8.5" ry="11"/></g>
      <g transform="rotate(288)"><ellipse cx="0" cy="-12" rx="8.5" ry="11"/></g>
    </g>
    <circle r="6.5" fill="var(--gold,#B4893E)" stroke="var(--p,#2F4A3A)" stroke-width="1.6"/>
    <g stroke="var(--gold,#B4893E)" stroke-width="1.3" stroke-linecap="round">
      <line x1="0" y1="0" x2="0" y2="-4"/><line x1="0" y1="0" x2="3.5" y2="2"/><line x1="0" y1="0" x2="-3.5" y2="2"/>
    </g>
    <path d="M-13 17 C -21 19 -24 26 -20 32 C -14 29 -12 22 -13 17 Z" fill="var(--leaf,#3D5C48)" stroke="var(--p,#2F4A3A)" stroke-width="1.2"/>
  </g>`;
const MONO = `<svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg" aria-label="Parbaughs">
  <text x="12" y="106" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="122" fill="var(--p,#2F4A3A)">P</text>${ROSE}</svg>`;
const themes = [
  ['cream',   '#E7E0CD', '#2F4A3A', '#F4EFE4', '#B4893E', '#3D5C48'],
  ['felt',    '#22332a', '#E0BB60', '#F4EFE4', '#E0BB60', '#5A7D4E'],
  ['bourbon', '#2a211a', '#E0BB60', '#EFE3C8', '#E0BB60', '#7a6a48'],
];
const cells = themes.map(([n,bg,p,rose,gold,leaf])=>`<div style="background:${bg};padding:28px;display:flex;flex-direction:column;align-items:center;gap:12px;width:280px"><div style="--p:${p};--rose:${rose};--gold:${gold};--leaf:${leaf};width:118px">${MONO}</div><div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:34px;color:${p}">Parbaughs<span style="color:${gold}">.</span></div><div style="font-family:monospace;font-size:9px;letter-spacing:3px;color:${gold}">GOLF CO · EST · YORK PA</div><div style="font-family:monospace;font-size:9px;letter-spacing:1px;color:${p};opacity:.55;margin-top:3px">${n}</div></div>`).join('');
const b = await chromium.launch();
const pg = await b.newPage({ viewport:{width:880,height:350} });
await pg.setContent('<body style="margin:0;display:flex;font-family:sans-serif">'+cells+'</body>');
await pg.screenshot({ path:'public/img/gen/logo-proof.png' });
await b.close(); console.log('done');
