// Generates original placeholder tee graphics for demo products
import { writeFileSync } from 'fs';
const items = [
 ['signal-lost','SIGNAL','LOST','#C9A961'],['2am-thoughts','2AM','THOUGHTS','#9C7F45'],['loading','LOADING','99%','#C9A961'],
 ['no-rules','NO RULES','CLUB','#9C7F45'],['offline-mode','OFFLINE','MODE','#F5F2EC'],['night-drive','NIGHT','DRIVE','#C9A961'],
 ['static-noise','STATIC','NOISE','#F5F2EC'],['main-character','MAIN','CHARACTER','#9C7F45']];
const tee = (fill, a, b, ink, back) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="#E9E5DD"/>
<path d="M170 120 L240 95 Q300 135 360 95 L430 120 L540 200 L490 280 L445 255 L445 660 L155 660 L155 255 L110 280 L60 200 Z" fill="${fill}" stroke="#00000022" stroke-width="2"/>
${back ? `<text x="300" y="330" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="58" fill="${ink}">${a}</text><text x="300" y="400" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="58" fill="${ink}">${b}</text><text x="300" y="450" text-anchor="middle" font-family="monospace" font-size="16" fill="${ink}" opacity=".7">VEST / BACK PRINT</text>`
 : `<rect x="230" y="200" width="140" height="140" fill="${ink}"/><text x="300" y="285" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="30" fill="${fill}">${a.split(' ')[0]}</text>`}
</svg>`;
for (const [s,a,b,acc] of items) {
  writeFileSync(`public/demo/${s}.svg`, tee('#151515', a, b, acc, false));
  writeFileSync(`public/demo/${s}-back.svg`, tee('#151515', a, b, acc, true));
}
const poster = (t, bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="${bg}"/>
${Array.from({length:12},(_,i)=>`<line x1="0" y1="${i*95}" x2="900" y2="${i*95+40}" stroke="${fg}" stroke-opacity=".12" stroke-width="2"/>`).join('')}
<text x="60" y="980" font-family="Impact,Arial Black,sans-serif" font-size="150" fill="${fg}">${t}</text></svg>`;
writeFileSync('public/demo/hero.svg', poster('VEST', '#0B0B0F', '#C9A961'));
writeFileSync('public/demo/editorial.svg', poster('CANVAS', '#9C7F45', '#0B0B0F'));
[['c1','AFTER DARK','#0B0B0F','#C9A961'],['c2','ONLINE','#C9A961','#0B0B0F'],['c3','CHAOS','#9C7F45','#0B0B0F'],['c4','DAILY','#DDD6C8','#0B0B0F']]
 .forEach(([f,t,bg,fg]) => writeFileSync(`public/demo/${f}.svg`, poster(t,bg,fg)));
