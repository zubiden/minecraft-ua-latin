const fetch = require('node-fetch');
const fs = require('fs');
const archiver = require('archiver');

async function main() {
  const args = process.argv.slice(2);
  const SNAPSHOT = args.length && args[0] === 'snapshot';
  console.log('Fetching current translation...');
  const translation = await fetchTranslation(SNAPSHOT);
  console.log('Transliterating...');
  const result = transliterate(translation);
  console.log('Archiving...');
  await archive(result);
  console.log('Done!');
}

async function fetchTranslation(isSnapshot) {
  const versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json());
  const latest = isSnapshot ? versions.latest.snapshot : versions.latest.release;
  const versionData = versions.versions.find(version => version.id === latest);
  if (!versionData) {
    console.warn(`Can't find version ${latest}`);
    return;
  }
  const versionMetadata = await fetch(versionData.url).then(res => res.json());
  const assetsUrl = versionMetadata.assetIndex.url;
  const assets = await fetch(assetsUrl).then(res => res.json());
  const hash = assets.objects["minecraft/lang/uk_ua.json"].hash;
  console.log(`Found uk_ua hash: ${hash}`)
  const translationUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;
  console.log(`Fetching ${translationUrl}`);
  const translation = await fetch(translationUrl).then(res => res.json());
  return translation;
}

function transliterate(translation) {
  const processed = {};
  for (let [key, value] of Object.entries(translation)) {
    processed[key] = textToSyllables(value);
  }
  return processed;
}

function archive(translation) {
  const output = fs.createWriteStream(__dirname + '/latin.zip');
  const archive = archiver('zip');
  archive.pipe(output);
  const string = JSON.stringify(translation, null, 2);
  archive.append(string, { name: 'assets/minecraft/lang/uk_la.json' });
  archive.append(fs.createReadStream(__dirname + '/pack.mcmeta'), { name: 'pack.mcmeta' });
  archive.append(fs.createReadStream(__dirname + '/pack.png'), { name: 'pack.png' });
  return archive.finalize();
}

const syllables = {
  "??????": "d??",
  "????": "dz",
  "????": "????",

  "????": "??",
  "????": "??",
  "????": "??",
  "????": "??",
  "????": "??",
  "????": "??",
  "????": "??",
  "????": "??",

  "????": "??a",
  "????": "??a",
  "????": "??a",
  "????": "??a",
  "????": "??a",
  "????": "??a",
  "????": "??a",
  "????": "??a",

  "????": "??u",
  "????": "??u",
  "????": "??u",
  "????": "??u",
  "????": "??u",
  "????": "??u",
  "????": "??u",
  "????": "??u",

  "????": "??e",
  "????": "??e",
  "????": "??e",
  "????": "??e",
  "????": "??e",
  "????": "??e",
  "????": "??e",
  "????": "??e",

  "'??": "ja",
  "'??": "ju",
  "'??": "je",
  "'??": "ji",

  "????": "x",

  "??": "a",
  "??": "b",
  "??": "v",
  "??": "h",
  "??": "g",
  "??": "d",
  "??": "e",
  "??": "je",
  "??": "??",
  "??": "z",
  "??": "y",
  "??": "i",
  "??": "ji",
  "??": "j",
  "??": "k",
  "??": "l",
  "??": "m",
  "??": "n",
  "??": "o",
  "??": "p",
  "??": "r",
  "??": "s",
  "??": "t",
  "??": "u",
  "??": "f",
  "??": "ch",
  "??": "c",
  "??": "??",
  "??": "??",
  "??": "????",
  "??": "ju",
  "??": "ja",
}

function textToSyllables(text) {
  if (!text) return "";
  Object.entries(syllables).forEach(([key, value]) => {
      text = replaceSyllable(text, key, value);
  });
  return text;
}

function replaceSyllable(text, syllable, replacement) {
  syllable = syllable.toLowerCase();
  replacement = replacement.toLowerCase();

  // ???????????? - ANANAS
  // ???????????? - ??nanas
  // BUG: ?????????????????? - JaLOVY??YNA

  const caps = syllable.toUpperCase();
  const capsR = replacement.toUpperCase();

  const capitalized = syllable.length === 1 ? caps : syllable[0].toUpperCase() + syllable.substring(1);
  const capitalizedR = syllable.length === 1 && replacement.length === 1 ? capsR : replacement[0].toUpperCase() + replacement.substring(1);

  return text.replace(new RegExp(syllable, 'g'), replacement).replace(new RegExp(capitalized, 'g'), capitalizedR).replace(new RegExp(caps, 'g'), capsR);
}

main();