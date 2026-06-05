// src/utils.js
export const CHOICES = [
  // Actions Fréquentes (Ergonomie "Repos ZQSD")
  { value: 'Couverture',    hotkey: 'a' },
  { value: 'Gravure',       hotkey: 'z' },
  { value: 'Manga',         hotkey: 'e' },
  { value: 'Publicité',     hotkey: 'd' },
  
  // Actions Rares (Mnémoniques)
  { value: 'Sommaire',      hotkey: 's' },
  { value: 'Article / Édito', hotkey: 'r' }, // R pour Rédaction/aRticle
  { value: 'Concours',      hotkey: 'c' },
  { value: 'Bonus',         hotkey: 'b' },
  { value: 'LineUp',        hotkey: 'l' },
  { value: 'Autre',         hotkey: 'x' },
];

export const PALETTE = {
  'Sommaire':        { c: '#8B5CF6', bw: '#C4B5FD' },
  'Manga':           { c: '#3B82F6', bw: '#93C5FD' },
  'Gravure':         { c: '#EC4899', bw: '#F9A8D4' },
  'Publicité':       { c: '#F59E0B', bw: '#FCD34D' },
  'Concours':        { c: '#EAB308', bw: '#FDE047' },
  'Article / Édito': { c: '#10B981', bw: '#6EE7B7' },
  'Couverture':      { c: '#EF4444', bw: '#FCA5A5' },
  'Bonus':           { c: '#06B6D4', bw: '#67E8F9' },
  'LineUp':          { c: '#84CC16', bw: '#D9F99D' },
  'Autre':           { c: '#6B7280', bw: '#D1D5DB' },
  'Non labellisé':   { c: '#94A3B8', bw: '#E2E8F0' },
};

const rawPaths = Object.keys(
  import.meta.glob('/public/echantillon/images/**/*.{jpg,jpeg,png,webp}')
);
export const IMAGE_LIST = rawPaths.map(p => p.replace('/public', ''));

export function loadAnnotations() {
  try { return JSON.parse(localStorage.getItem('manga-annotations') || '{}'); }
  catch { return {}; }
}

export function loadImageCache() {
  try { return JSON.parse(localStorage.getItem('manga-image-cache') || '{}'); }
  catch { return {}; }
}

export function parseImagePath(path) {
  if (!path) return { magazine: '', numero: '', filename: '', display: '—', folderKey: '' };
  const parts = path.split('/');
  const filename = parts.pop() || '';
  const numero   = parts.pop() || '';
  const magazine = parts.pop() || '';
  
  return { magazine, numero, filename, display: `${numero} - ${filename}`, folderKey: `${magazine}/${numero}` };
}

export function getBaseCategory(cat) {
  if (!cat) return null;
  if (cat.startsWith('Manga')) return 'Manga'; 
  return cat;
}

function detectColorFromImg(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 250;
    canvas.height = Math.round((imgEl.naturalHeight / imgEl.naturalWidth) * 250);
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colorPixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      if (diff > 45) {
        const saturation = max === 0 ? 0 : diff / max;
        if (saturation > 0.30) {
          colorPixelCount++;
        }
      }
    }
    return colorPixelCount > 40;
  } catch { 
    return null; 
  }
}

function computeDHash(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 9;
    canvas.height = 8;
    ctx.drawImage(imgEl, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data;

    const grays = [];
    for (let i = 0; i < data.length; i += 4) {
      grays.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }

    let hashBinary = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = grays[y * 9 + x];
        const right = grays[y * 9 + x + 1];
        hashBinary += left > right ? '1' : '0';
      }
    }

    let hexHash = '';
    for (let i = 0; i < 64; i += 4) {
      hexHash += parseInt(hashBinary.substring(i, i + 4), 2).toString(16);
    }
    return hexHash;
  } catch {
    return null;
  }
}

export function analyzeImage(imgEl) {
  return {
    isColor: detectColorFromImg(imgEl),
    hash: computeDHash(imgEl)
  };
}

export async function saveToServer(type, content) {
  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content })
    });
    return response.ok;
  } catch (e) {
    console.error(`Échec de la sauvegarde serveur pour ${type}:`, e);
    return false;
  }
}

export function persistAnnotations(data) {
  try { 
    localStorage.setItem('manga-annotations', JSON.stringify(data)); 
    return true; 
  }
  catch { return false; }
}