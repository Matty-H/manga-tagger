// src/components/RightSidebar.jsx
import { useEffect, useRef } from 'react';
import { PALETTE, getBaseCategory, parseImagePath } from '../utils';

export default function RightSidebar({
  folderGroups, currentImageInfo, annotations, imageCache,
  analyzingPath, currentPath, jumpToImage
}) {
  const folderRefs = useRef({});
  const folderKey = currentImageInfo?.folderKey;

  useEffect(() => {
    if (folderKey) {
      const activeFolderEl = folderRefs.current[folderKey];
      if (activeFolderEl) {
        activeFolderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [folderKey]);

  return (
    <div className="w-[280px] min-w-[280px] bg-white border-l-[0.5px] border-[#e0e0e0] flex flex-col overflow-hidden z-10">
      <div className="px-4 py-[14px] border-b-[0.5px] border-[#e8e8e8] font-medium text-[15px] flex items-center gap-2">
        📚 Aperçu des Dossiers
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {Object.entries(folderGroups).map(([folder, paths]) => {
          const isCurrentFolder = folderKey === folder;
          
          return (
            <div 
              key={folder} 
              ref={el => folderRefs.current[folder] = el}
              className={`scroll-mt-4 flex flex-col gap-[6px] ${isCurrentFolder ? 'opacity-100' : 'opacity-60 hover:opacity-100 transition-opacity'}`}
            >
              <div className="text-[12px] font-semibold text-[#555] flex justify-between items-end">
                <span className="truncate pr-2">{folder}</span>
                <span className="text-[10px] text-[#999] font-normal">{paths.length} p.</span>
              </div>
              <div className="flex flex-wrap gap-[3px]">
                {paths.map((p) => {
                  const rawCat = annotations[p]?.category;
                  const baseCat = getBaseCategory(rawCat);
                  
                  const cacheData = imageCache[p];
                  const isAnalyzed = cacheData !== undefined;
                  // Si l'ancien cache local est toujours là, il renvoie un booléen. Sinon, on lit la prop isColor
                  const isColorFlag = typeof cacheData === 'boolean' ? cacheData : cacheData?.isColor;
                  
                  let dotColor = 'transparent';
                  if (isAnalyzed && isColorFlag !== undefined) {
                    if (baseCat && PALETTE[baseCat]) {
                      dotColor = isColorFlag ? PALETTE[baseCat].c : PALETTE[baseCat].bw;
                    } else {
                      dotColor = isColorFlag ? PALETTE['Non labellisé'].c : PALETTE['Non labellisé'].bw;
                    }
                  }

                  const isActive = p === currentPath;
                  const isAnalyzing = p === analyzingPath;
                  
                  let dotClass = "w-[12px] h-[12px] rounded-[2px] transition-transform ";
                  if (isActive) dotClass += "ring-2 ring-black scale-125 z-10 ";
                  else if (isAnalyzing) dotClass += "ring-2 ring-[#3B82F6] animate-pulse scale-110 z-10 ";
                  else if (!isAnalyzed) dotClass += "border-[0.5px] border-[#ccc] bg-transparent hover:scale-110 hover:ring-1 hover:ring-gray-400 ";
                  else dotClass += "hover:scale-110 hover:ring-1 hover:ring-gray-400 ";
                  
                  return (
                    <button
                      key={p}
                      title={`${parseImagePath(p).filename}${rawCat ? ` - ${rawCat}` : ''}`}
                      onClick={() => jumpToImage(p)}
                      className={dotClass}
                      style={isAnalyzed ? { backgroundColor: dotColor } : {}}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t-[0.5px] border-[#eee] bg-[#fcfcfc]">
        <div className="text-[11px] font-semibold tracking-[0.07em] uppercase text-[#888] mb-3">
          Légende (Couleur / N&B)
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-1">
          {Object.entries(PALETTE).map(([label, colors]) => (
            <div key={label} className="flex items-center gap-[6px] text-[11px] text-[#555]">
              <div className="flex rounded-[2px] overflow-hidden border-[0.5px] border-black/10 shrink-0 shadow-sm">
                 <span className="w-[8px] h-[10px]" style={{ backgroundColor: colors.c }} />
                 <span className="w-[8px] h-[10px]" style={{ backgroundColor: colors.bw }} />
              </div>
              <span className="truncate" title={label}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}