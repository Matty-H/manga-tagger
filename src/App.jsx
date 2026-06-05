// src/App.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  CHOICES, IMAGE_LIST, loadAnnotations, loadImageCache, 
  persistAnnotations, analyzeImage, parseImagePath, saveToServer
} from './utils';

// Ajoute ces imports magiques Vite
import annotationsUrl from '../data_annotations.json?url';
import cacheUrl from '../data_cache.json?url';

import LeftSidebar from './components/LeftSidebar';
import MainViewer from './components/MainViewer';
import RightSidebar from './components/RightSidebar';

export default function App() {
  const [annotations, setAnnotations] = useState(loadAnnotations);
  const [imageCache, setImageCache]   = useState(loadImageCache);
  
  const [colorFilter, setColorFilter] = useState('all'); 
  const [labelFilter, setLabelFilter] = useState('all'); 
  
  const [filteredIdx, setFilteredIdx] = useState(0);
  const [isColor, setIsColor]         = useState(null);
  const [saveStatus, setSaveStatus]   = useState('Auto-save actif');
  
  const [mangaStartIndex, setMangaStartIndex] = useState(null); 
  const [analyzingPath, setAnalyzingPath]     = useState(null);
  
  const imgRef = useRef(null);
  const imageCacheRef = useRef(imageCache);
  const loadingFoldersRef = useRef(new Set());

  useEffect(() => {
    async function restoreData() {
      let hasRestored = false;

      // 1. Restaurer les annotations si la mémoire locale est vide
      if (Object.keys(annotations).length === 0) {
        try {
          // Le '?t=' + Date.now() force le navigateur à contourner son cache
          const res = await fetch(`${annotationsUrl}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (Object.keys(data).length > 0) {
              setAnnotations(data);
              persistAnnotations(data); // On réécrit le localStorage
              hasRestored = true;
            }
          }
        } catch (e) {
          console.warn("Fichier data_annotations.json inaccessible", e);
        }
      }

      // 2. Restaurer le cache des images si vide
      if (Object.keys(imageCache).length === 0) {
        try {
          const res = await fetch(`${cacheUrl}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (Object.keys(data).length > 0) {
              setImageCache(data);
              localStorage.setItem('manga-image-cache', JSON.stringify(data));
              hasRestored = true;
            }
          }
        } catch (e) {
          console.warn("Fichier data_cache.json inaccessible", e);
        }
      }

      if (hasRestored) {
        setSaveStatus('🔄 Restauré depuis le disque');
        setTimeout(() => setSaveStatus('Auto-save actif'), 3000);
      }
    }

    restoreData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    imageCacheRef.current = imageCache;
  }, [imageCache]);

  const folderGroups = useMemo(() => {
    const groups = {};
    IMAGE_LIST.forEach(path => {
      const { folderKey } = parseImagePath(path);
      if (!groups[folderKey]) groups[folderKey] = [];
      groups[folderKey].push(path);
    });
    return groups;
  }, []);

  const filteredList = useMemo(() => {
    return IMAGE_LIST.filter(path => {
      if (labelFilter === 'unlabeled' && annotations[path]) return false;
      if (labelFilter === 'labeled' && !annotations[path]) return false;
      
      const cache = imageCache[path];
      const colorFlag = typeof cache === 'boolean' ? cache : cache?.isColor;
      
      if (colorFilter === 'color' && colorFlag !== true) return false;
      if (colorFilter === 'bw' && colorFlag !== false) return false;
      return true;
    });
  }, [labelFilter, colorFilter, annotations, imageCache]);

  const safeIdx = Math.max(0, Math.min(filteredIdx, filteredList.length > 0 ? filteredList.length - 1 : 0));
  const currentPath = filteredList[safeIdx] ?? null;
  const currentImageInfo = parseImagePath(currentPath);

  // ─── Analyse asynchrone (Couleur + Hash) ──────────────────────────────────
  useEffect(() => {
    const folderKey = currentImageInfo?.folderKey;
    const loadingFolders = loadingFoldersRef.current;

    if (!folderKey || loadingFolders.has(folderKey)) return;

    const paths = folderGroups[folderKey] || [];
    // Vérifie qu'on a bien un objet avec un hash, pas un vieux cache booléen
    if (paths.every(p => imageCacheRef.current[p] && imageCacheRef.current[p].hash)) return;

    let isCancelled = false;
    loadingFolders.add(folderKey);

    const preloadFolderColors = async () => {
      for (const path of paths) {
        if (isCancelled) break;
        
        const existingCache = imageCacheRef.current[path];
        // Si c'est déjà un objet complet avec hash, on ignore
        if (existingCache && existingCache.hash) continue;

        setAnalyzingPath(path);

        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (!isCancelled) {
              const res = analyzeImage(img);
              if (res.isColor !== null && res.hash !== null) {
                setImageCache(prev => ({ ...prev, [path]: res }));
                
                // Auto-réparation du Hash si label assigné sans hash
                setAnnotations(prev => {
                  if (prev[path] && !prev[path].image_hash) {
                    const newAnnots = { ...prev, [path]: { ...prev[path], image_hash: res.hash } };
                    persistAnnotations(newAnnots);
                    return newAnnots;
                  }
                  return prev;
                });
              }
            }
            resolve();
          };
          img.onerror = () => resolve(); 
          img.src = path;
        });
      }
      if (!isCancelled) {
        setAnalyzingPath(null);
        loadingFolders.delete(folderKey);
      }
    };

    preloadFolderColors();

    return () => {
      isCancelled = true;
      loadingFolders.delete(folderKey);
      setAnalyzingPath(prev => paths.includes(prev) ? null : prev);
    };
  }, [currentImageInfo?.folderKey, folderGroups]);

  // Remplacement de la fonction triggerSave (qui devient asynchrone)
  const triggerSave = useCallback(async (newAnnotations) => {
    // Sauvegarde en local (fallback)
    persistAnnotations(newAnnotations); 
    
    // Sauvegarde sur le disque via Vite
    const serverOk = await saveToServer('annotations', newAnnotations);
    
    setSaveStatus(serverOk ? '✓ Fichier JSON sauvegardé' : '⚠ Erreur JSON');
    setTimeout(() => setSaveStatus('Auto-save actif'), 2000);
  }, []);

  // Remplacement du useEffect gérant le cache des images (imageCache)
  useEffect(() => {
    if (Object.keys(imageCache).length === 0) return; // Ne pas sauvegarder un cache vide au démarrage
    
    try { 
      localStorage.setItem('manga-image-cache', JSON.stringify(imageCache)); 
    } catch (err) { 
      console.warn(err); 
    }
    
    // Sauvegarde silencieuse sur le disque
    saveToServer('cache', imageCache);
  }, [imageCache]);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const path = img.src.replace(window.location.origin, '');
    const cache = imageCache[path];
    
    // On s'assure d'avoir l'objet complet
    if (cache && cache.hash) {
      setIsColor(cache.isColor);
      return;
    }
    
    const res = analyzeImage(img);
    setIsColor(res.isColor);
    if (res.isColor !== null) {
      setImageCache(prev => ({ ...prev, [path]: res }));
    }
  }, [imageCache]);

  

  // ─── Navigation & Labellisation ────────────────────────────────────────────
  const toggleFlag = useCallback((flagName) => {
    if (!currentPath) return;
    setAnnotations(prev => {
      const currentAnnot = prev[currentPath];
      // Optionnel : empêcher de flagger si la page n'a pas encore de catégorie
      if (!currentAnnot) return prev; 
      
      const newAnnotations = {
        ...prev,
        [currentPath]: { ...currentAnnot, [flagName]: !currentAnnot[flagName] }
      };
      triggerSave(newAnnotations);
      return newAnnotations;
    });
  }, [currentPath, triggerSave]);
  
  // Modifie ton handleAnnotate pour gérer l'auto-start du chapitre
  const handleAnnotate = useCallback((baseCategory) => {
    if (!currentPath) return;
  
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      let hasUpdates = false;
  
      // Ajout du paramètre 'forceStartFlag'
      // Dans App.jsx, au niveau de la fonction applyLabelToPath (dans handleAnnotate)
      const applyLabelToPath = (path, categoryToApply, forceStartFlag = false) => {
        const info = parseImagePath(path);
        
        // On récupère les infos du cache (hash, couleur, ratio)
        const cacheParams = imageCacheRef.current[path] || {};
        const existing = prev[path] || {};
        
        // L'image est-elle paysage ? (On regarde le cache, sinon on garde l'ancienne valeur)
        const isLandscape = existing.is_landscape || cacheParams.isLandscape || false;

        newAnnotations[path] = {
          ...existing,
          file_path: path,
          file_name: info.filename,
          category: categoryToApply,
          magazine: info.magazine,
          numero: info.numero,
          image_hash: cacheParams.hash || null,
          is_chapter_start: forceStartFlag || existing.is_chapter_start || false,
          is_split: existing.is_split || false,
          is_landscape: isLandscape // Auto-tag !
        };
        hasUpdates = true;
      };
  
      if (baseCategory === 'Manga') {
        if (mangaStartIndex !== null) {
          const start = Math.min(mangaStartIndex, safeIdx);
          const end = Math.max(mangaStartIndex, safeIdx);
          for (let i = start; i <= end; i++) {
            // La toute première page du batch manga devient le start
            applyLabelToPath(filteredList[i], 'Manga', i === start);
          }
        } else {
          // Labellisation unique : on regarde si la page précédente est "Manga"
          const prevPath = safeIdx > 0 ? filteredList[safeIdx - 1] : null;
          const prevIsManga = prevPath && prev[prevPath]?.category === 'Manga';
          applyLabelToPath(currentPath, 'Manga', !prevIsManga);
        }
      } else {
        if (mangaStartIndex !== null) {
          const isForward = safeIdx > mangaStartIndex;
          const start = isForward ? mangaStartIndex : safeIdx + 1;
          const end = isForward ? safeIdx - 1 : mangaStartIndex;
          for (let i = start; i <= end; i++) applyLabelToPath(filteredList[i], 'Manga', i === start);
          applyLabelToPath(filteredList[safeIdx], baseCategory);
        } else {
          applyLabelToPath(currentPath, baseCategory);
        }
      }
  
      if (hasUpdates) triggerSave(newAnnotations);
      return hasUpdates ? newAnnotations : prev;
    });
  
    if (baseCategory === 'Manga' && mangaStartIndex === null) setMangaStartIndex(safeIdx);
    else {
      setMangaStartIndex(null);
      if (labelFilter !== 'unlabeled') setFilteredIdx(prev => Math.min(filteredList.length - 1, prev + 1));
    }
  }, [currentPath, labelFilter, filteredList, safeIdx, mangaStartIndex, triggerSave]);

  // ─── Compléter tout le reste en "Manga" ────────────────────────────────────
  const fillRemainingWithManga = useCallback(() => {
    if (!window.confirm("Voulez-vous vraiment assigner le label 'Manga' à toutes les images restantes ?")) return;

    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      let hasUpdates = false;

      IMAGE_LIST.forEach(path => {
        if (!newAnnotations[path]) {
          const info = parseImagePath(path);
          const hash = imageCacheRef.current[path]?.hash || null;
          
          newAnnotations[path] = {
            file_path: path,
            file_name: info.filename,
            category: 'Manga',
            magazine: info.magazine,
            numero: info.numero,
            image_hash: hash
          };
          hasUpdates = true;
        }
      });

      if (hasUpdates) triggerSave(newAnnotations);
      return hasUpdates ? newAnnotations : prev;
    });
  }, [triggerSave]);

  const handleNextFolder = useCallback(() => {
    if (!currentPath) return;
    const startFolder = parseImagePath(currentPath).folderKey;
    let i = safeIdx;
    while (i < filteredList.length) {
      if (parseImagePath(filteredList[i]).folderKey !== startFolder) {
        setFilteredIdx(i);
        return;
      }
      i++;
    }
  }, [currentPath, filteredList, safeIdx]);

  const handlePrevFolder = useCallback(() => {
    if (!currentPath || safeIdx === 0) return;
    const startFolder = parseImagePath(currentPath).folderKey;
    let i = safeIdx;
    while (i >= 0 && parseImagePath(filteredList[i]).folderKey === startFolder) i--;
    if (i < 0) { setFilteredIdx(0); return; }
    const targetFolder = parseImagePath(filteredList[i]).folderKey;
    while (i >= 0 && parseImagePath(filteredList[i]).folderKey === targetFolder) i--;
    setFilteredIdx(i + 1);
  }, [currentPath, filteredList, safeIdx]);

  const jumpToImage = useCallback((path) => {
    setLabelFilter('all');
    setColorFilter('all');
    setMangaStartIndex(null);
    setFilteredIdx(IMAGE_LIST.indexOf(path));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlag('is_split');
        return;
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        toggleFlag('is_chapter_start');
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'arrowleft')  { setFilteredIdx(prev => Math.max(0, prev - 1)); return; }
      if (k === 'arrowright') { setFilteredIdx(prev => Math.min(filteredList.length - 1, prev + 1)); return; }
      const choice = CHOICES.find(c => c.hotkey === k);
      if (choice) handleAnnotate(choice.value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAnnotate, filteredList.length, toggleFlag]);

  const totalCount   = IMAGE_LIST.length;
  const labeledCount = Object.keys(annotations).length;
  const pct = totalCount > 0 ? Math.round((labeledCount / totalCount) * 100) : 0;
  const currentLabel = currentPath ? annotations[currentPath]?.category : null;
  const currentHash  = currentPath ? imageCache[currentPath]?.hash : null;

  return (
    <div className="flex h-screen font-sans text-[#1a1a1a] bg-[#f4f4f2]">
      <LeftSidebar 
        totalCount={totalCount} labeledCount={labeledCount} pct={pct}
        colorFilter={colorFilter} setColorFilter={setColorFilter}
        labelFilter={labelFilter} setLabelFilter={setLabelFilter}
        setFilteredIdx={setFilteredIdx} setMangaStartIndex={setMangaStartIndex}
        mangaStartIndex={mangaStartIndex} currentLabel={currentLabel}
        handleAnnotate={handleAnnotate} saveStatus={saveStatus}
        fillRemainingWithManga={fillRemainingWithManga}
      />
      
      <MainViewer 
        currentPath={currentPath} currentImageInfo={currentImageInfo}
        mangaStartIndex={mangaStartIndex} isColor={isColor}
        currentLabel={currentLabel} filteredList={filteredList} safeIdx={safeIdx}
        imgRef={imgRef} handleImageLoad={handleImageLoad}
        handlePrevFolder={handlePrevFolder} handleNextFolder={handleNextFolder}
        setFilteredIdx={setFilteredIdx}
        currentHash={currentHash} 
        annotations={annotations} 
        imageCache={imageCache}
      />
      
      <RightSidebar 
        folderGroups={folderGroups} currentImageInfo={currentImageInfo}
        annotations={annotations} imageCache={imageCache} 
        analyzingPath={analyzingPath} currentPath={currentPath}
        jumpToImage={jumpToImage}
      />
    </div>
  );
}