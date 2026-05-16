import fs from 'fs';
try {
  const content = fs.readFileSync('c:/Users/Eyüphan/Documents/GitHub/sitelerim3/manav-platform/data/articles/simgesel-baba-coktugunde.json', 'utf8');
  JSON.parse(content);
  console.log("JSON is valid");
} catch (e) {
  console.error(e);
}
