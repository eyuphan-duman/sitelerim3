import fs from 'fs';
const content = fs.readFileSync('c:/Users/Eyüphan/Documents/GitHub/sitelerim3/manav-platform/data/articles/simgesel-baba-coktugunde.json', 'utf8');
console.log("Snippet at 2330:");
console.log(content.substring(2310, 2350));
