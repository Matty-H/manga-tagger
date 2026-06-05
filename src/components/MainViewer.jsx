// components/MainViewer.jsx
import { PALETTE, getBaseCategory } from '../utils';

export default function MainViewer({
  currentPath, currentImageInfo, mangaStartIndex,
  isColor, currentLabel, filteredList, safeIdx,
  imgRef, handleImageLoad, handlePrevFolder, handleNextFolder, setFilteredIdx,
  currentHash
}) {

  const getBadgeClass = (type, cat) => {
    const base = "text-[11px] px-[10px] py-[3px] rounded-[20px] whitespace-nowrap ";
    if (type === 'alert') return base + "bg-[#FFF8E1] text-[#B97700] border-[0.5px] border-[#FFC107]";
    if (type === 'color') return base + "bg-[#f5f5f2] text-[#666] border-[0.5px] border-[#ddd]";
    if (type === 'dynamic-label' && cat) return base + "border-[0.5px] font-medium";
    return base;
  };

  const getDynamicLabelStyle = (cat) => {
     const baseCat = getBaseCategory(cat);
     if (!baseCat || !PALETTE[baseCat]) return {};
     const color = PALETTE[baseCat].c;
     return { backgroundColor: `${color}26`, borderColor: color, color: '#1a1a1a' };
  };

  const getNavBtnClass = (disabled, isSecondary) => {
    const base = "rounded-md flex items-center gap-[6px] transition-all duration-150 border-[0.5px] ";
    const style = isSecondary ? "px-[12px] py-[7px] text-[12px] font-normal bg-[#f9f9f9]" : "px-[18px] py-[7px] text-[13px] font-medium bg-white";
    const state = disabled ? "cursor-default border-[#eee] text-[#ccc]" : "cursor-pointer border-[#ddd] text-[#333] hover:bg-[#f0f0f0]";
    return base + style + " " + state;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="py-[9px] px-4 bg-white border-b-[0.5px] border-[#eee] flex items-center gap-[10px]">
        {currentPath ? (
          <>
            <span className="text-[11px] px-[8px] py-[3px] rounded-[4px] bg-[#eee] text-[#555] font-semibold">{currentImageInfo.magazine}</span>
            <span className="flex-1 text-[14px] font-medium text-[#333] whitespace-nowrap overflow-hidden text-ellipsis">{currentImageInfo.display}</span>
          </>
        ) : (
          <span className="flex-1 text-[14px] font-medium text-[#333] whitespace-nowrap overflow-hidden text-ellipsis">—</span>
        )}
        
        {mangaStartIndex !== null && (
          <span className={getBadgeClass('alert')}>Sélection Manga depuis la page {mangaStartIndex + 1}...</span>
        )}
        
        <span className={getBadgeClass('color')}>
          {isColor === true ? 'CMJN' : isColor === false ? 'NB' : 'Analyse...'}
        </span>

        {currentHash && (
          <span className="text-[10px] px-[8px] py-[3px] rounded-[20px] bg-[#f0f0f0] text-[#888] font-mono border-[0.5px] border-[#ddd]" title="dHash (Empreinte visuelle)">
            #{currentHash}
          </span>
        )}
        
        {currentLabel && (
          <span className={getBadgeClass('dynamic-label', currentLabel)} style={getDynamicLabelStyle(currentLabel)}>
            {currentLabel}
          </span>
        )}
        
        <span className="text-[13px] font-medium whitespace-nowrap ml-[8px]">
          {filteredList.length > 0 ? `${safeIdx + 1} / ${filteredList.length}` : '—'}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-[20px] relative overflow-hidden">
        {filteredList.length === 0 || !currentPath ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#bbb] gap-[10px]">
            <div className="text-[32px]">🖼️</div>
            <p className="text-[14px]">Aucune image dans ce filtre</p>
          </div>
        ) : (
          <img ref={imgRef} key={currentPath} src={currentPath} alt="Page en cours" onLoad={handleImageLoad} className="max-w-full max-h-full object-contain rounded-[6px] shadow-md" />
        )}
        
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex gap-[6px] bg-white p-[6px] rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <button className={getNavBtnClass(safeIdx === 0, true)} disabled={safeIdx === 0} onClick={handlePrevFolder} title="Dossier précédent">⏮</button>
          <button className={getNavBtnClass(safeIdx === 0, false)} disabled={safeIdx === 0} onClick={() => setFilteredIdx(p => Math.max(0, p - 1))}>←</button>
          <button className={getNavBtnClass(safeIdx >= filteredList.length - 1, false)} disabled={safeIdx >= filteredList.length - 1} onClick={() => setFilteredIdx(p => Math.min(filteredList.length - 1, p + 1))}>→</button>
          <button className={getNavBtnClass(safeIdx >= filteredList.length - 1, true)} disabled={safeIdx >= filteredList.length - 1} onClick={handleNextFolder} title="Dossier suivant">⏭</button>
        </div>
      </div>
    </div>
  );
}