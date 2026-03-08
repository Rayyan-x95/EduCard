const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'educard-landing', 'src');

const replacements = [
  // GSAP absolute colors
  { regex: /'#111111'/g, replacement: "'#0F172A'" },
  { regex: /'#F5F3EE'/g, replacement: "'#F3F4F6'" },
  { regex: /rgba\(245,\s*243,\s*238,\s*0\.7\)/g, replacement: "rgba(243, 244, 246, 0.8)" },
  { regex: /rgba\(17,17,17,0\.1\)/g, replacement: "rgba(15, 23, 42, 0.1)" },
  // Tailwind Arbitrary Hex colors
  { regex: /(bg|text|border|shadow)-\[#111111\]/gi, replacement: "-dark" },
  { regex: /(bg|text|border|shadow)-\[#F5F3EE\]/gi, replacement: "-light" },
  { regex: /(bg|text|border|shadow)-\[#E8E4DD\]/gi, replacement: "-light" },
  { regex: /(bg|text|border|shadow)-\[#E63B2E\]/gi, replacement: "-primary" },
  { regex: /(bg|text|border|shadow)-\[#32cd32\]/gi, replacement: "-accent" },
  { regex: /(bg|text|border|shadow)-\[#1a1a1a\]/gi, replacement: "-slate-800" },
  // Button unified replacements
  { regex: /magnetic-btn bg-\[#E63B2E\] text-\[#F5F3EE\] (px-\w+ py-\w+) rounded-full font-mono text-\w+ font-bold overflow-hidden relative group/g, replacement: "btn-primary  overflow-hidden relative group" },
  { regex: /magnetic-btn bg-\[#E63B2E\] text-\[#F5F3EE\] (px-\w+ py-\w+) rounded-full font-mono text-\w+ inline-flex items-center gap-\w+ group/g, replacement: "btn-primary " },
  { regex: /magnetic-btn bg-\[#E63B2E\] text-\[#F5F3EE\] px-12 py-5 rounded-full font-mono text-lg font-bold inline-flex items-center gap-4 group shadow-xl shadow-\[#E63B2E\]\\\/20/gi, replacement: "btn-primary px-12 py-5 text-lg shadow-xl shadow-primary/20" },
  { regex: /bg-\[#E8E4DD\] text-\[#111111\] font-bold font-mono py-4 rounded-xl mt-8 flex items-center justify-center gap-2 hover:bg-\[#F5F3EE\] transition-colors/g, replacement: "btn-primary w-full py-4 mt-8 justify-center rounded-xl" },
  { regex: /bg-\[#111111\] text-\[#F5F3EE\] px-8 py-3 rounded-full font-mono text-sm hover:bg-\[#E63B2E\] transition-colors/g, replacement: "btn-secondary px-8 py-3 bg-dark hover:bg-primary hover:text-white border-none" }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(jsx?|css)$/.test(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });

      content = content.replace(/bg-primary animate-pulse/g, "bg-accent animate-pulse");
      content = content.replace(/text-primary uppercase tracking-widest/g, "text-accent uppercase tracking-widest");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated " + fullPath);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Refactor complete!');
