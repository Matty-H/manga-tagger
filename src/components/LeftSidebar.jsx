// src/components/LeftSidebar.jsx
import { CHOICES, PALETTE, getBaseCategory } from '../utils';

// Disposition physique d'un clavier AZERTY
const ROW1 = ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW2 = ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'];
const ROW3 = ['w', 'x', 'c', 'v', 'b', 'n'];

// Pour la légende en bas
const ERGO_KEYS = ['a', 'z', 'e', 'd']; // Position de repos "Gamer" (Auriculaire, Annulaire, Majeur, Index)
const MNEMO_KEYS = ['s', 'r', 'c', 'b', 'l', 'n', 'x']; // Initiales logiques

const KeyboardRow = ({ keys, offsetClass, currentLabel, mangaStartIndex, handleAnnotate }) => (
  // Réduction du gap à 2px pour éviter les débordements
  <div className={`flex gap-[2px] ${offsetClass}`}>
    {keys.map(k => {
      const choice = CHOICES.find(c => c.hotkey === k);
      
      // Touche non assignée (Réduction taille: 18x22)
      if (!choice) {
        return (
          <div key={k} className="w-[18px] h-[22px] rounded-[3px] bg-[#e4e4e3] border-[0.5px] border-[#d0d0d0] flex justify-center items-center text-[9px] text-[#b0b0b0] uppercase font-mono shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] cursor-default">
            {k}
          </div>
        );
      }
      
      const colors = PALETTE[choice.value] || PALETTE['Autre'];
      const isSelected = currentLabel != null && getBaseCategory(currentLabel) === choice.value;
      const isToggleActive = mangaStartIndex !== null && choice.value === 'Manga';

      // Touche assignée (Réduction taille: 18x22)
      let btnClass = "w-[18px] h-[22px] rounded-[3px] font-mono text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ";
      let btnStyle = {};

      if (isToggleActive) {
        btnClass += "border-[#FFC107] bg-[#FFF8E1] text-[#B97700] border-b-[1px] translate-y-[2px] shadow-inner";
      } else if (isSelected) {
        btnStyle = { backgroundColor: colors.c, borderColor: colors.c, color: '#fff' };
        btnClass += "border-b-[1px] translate-y-[2px] shadow-inner";
      } else {
        btnStyle = { backgroundColor: '#fcfcfc', color: '#333' };
        btnClass += "border-[0.5px] border-[#ccc] border-b-[3px] shadow-sm hover:bg-[#f0f0f0] hover:border-b-[2px] hover:translate-y-[1px]";
      }

      return (
        <button 
          key={k}
          onClick={() => handleAnnotate(choice.value)}
          title={`${choice.value} (${k.toUpperCase()})`}
          className={btnClass}
          style={btnStyle}
        >
          <span className="leading-none">{k.toUpperCase()}</span>
          {!isSelected && !isToggleActive && (
            <span className="absolute bottom-[2px] w-[8px] h-[2px] rounded-full" style={{ backgroundColor: colors.c }} />
          )}
        </button>
      );
    })}
  </div>
);

const LabelList = ({ hotkeys, title, currentLabel, mangaStartIndex, handleAnnotate }) => (
  <div className="flex flex-col gap-[4px] flex-1">
    <div className="text-[9px] font-bold tracking-wider uppercase text-[#aaa] mb-[2px] text-center">{title}</div>
    {hotkeys.map(k => {
      const choice = CHOICES.find(c => c.hotkey === k);
      if (!choice) return null;
      
      const baseCat = choice.value;
      const isSelected = currentLabel != null && getBaseCategory(currentLabel) === baseCat;
      const isToggleActive = mangaStartIndex !== null && baseCat === 'Manga';
      const colors = PALETTE[baseCat] || PALETTE['Autre'];
      
      let btnClass = "flex justify-between items-center px-[6px] py-[5px] rounded-[4px] transition-all border-[0.5px] text-left ";
      let btnStyle = {};

      if (isToggleActive) {
        btnClass += "border-[#FFC107] bg-[#FFF8E1] text-[#B97700] font-medium shadow-sm";
      } else if (isSelected) {
        btnClass += "font-medium shadow-sm";
        btnStyle = { backgroundColor: `${colors.c}26`, borderColor: colors.c, color: '#1a1a1a' };
      } else {
        btnClass += "border-transparent bg-transparent text-[#555] hover:bg-[#f0f0ee] hover:border-[#ddd]";
      }

      return (
        <button 
          key={k} 
          className={btnClass} 
          style={btnStyle} 
          onClick={() => handleAnnotate(choice.value)}
          title={choice.value}
        >
          <div className="flex items-center gap-[6px] overflow-hidden">
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: colors.c }} />
            <span className="text-[10px] truncate">{choice.value}</span>
          </div>
          <kbd className={`text-[8px] font-mono rounded-[2px] px-[4px] py-px ml-[4px] ${isSelected || isToggleActive ? 'bg-white/60 text-black' : 'text-[#888] bg-[#e8e8e8]'}`}>
            {k.toUpperCase()}
          </kbd>
        </button>
      );
    })}
  </div>
);

export default function LeftSidebar({
  totalCount, labeledCount, pct,
  colorFilter, setColorFilter,
  labelFilter, setLabelFilter,
  setFilteredIdx, setMangaStartIndex,
  mangaStartIndex, currentLabel, handleAnnotate, saveStatus,
  fillRemainingWithManga
}) {
  return (
    <div className="w-[264px] min-w-[264px] bg-white border-r-[0.5px] border-[#e0e0e0] flex flex-col overflow-hidden z-10">

      {/* Progression */}
      <div className="py-[11px] px-4 border-b-[0.5px] border-[#eee]">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-[#888] mb-[7px]">Progression</div>
        <div className="h-1 bg-[#f0f0ee] rounded-[2px] mt-[7px] mb-[5px] overflow-hidden">
          <div className="h-full bg-[#1D9E75] rounded-[2px] transition-[width] duration-300 ease-in-out" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[12px] text-[#888]">
          <span>{labeledCount} / {totalCount} labellisées</span>
          <span>{pct} %</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="py-[11px] px-4 border-b-[0.5px] border-[#eee]">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-[#888] mb-[7px]">Filtres</div>
        <div className="flex flex-col gap-[8px]">
          <div className="flex bg-[#f0f0ee] p-[2px] rounded-[6px]">
            <button className={`flex-1 text-[11px] py-[4px] rounded-[4px] transition-colors ${colorFilter === 'bw' ? 'bg-white shadow-sm font-medium text-[#333]' : 'text-[#777] hover:bg-[#e8e8e6]'}`} onClick={() => { setColorFilter(colorFilter === 'bw' ? 'all' : 'bw'); setFilteredIdx(0); setMangaStartIndex(null); }}>N & B</button>
            <button className={`flex-1 text-[11px] py-[4px] rounded-[4px] transition-colors ${colorFilter === 'color' ? 'bg-white shadow-sm font-medium text-[#333]' : 'text-[#777] hover:bg-[#e8e8e6]'}`} onClick={() => { setColorFilter(colorFilter === 'color' ? 'all' : 'color'); setFilteredIdx(0); setMangaStartIndex(null); }}>Couleur</button>
          </div>
          <div className="flex bg-[#f0f0ee] p-[2px] rounded-[6px]">
            <button className={`flex-1 text-[11px] py-[4px] rounded-[4px] transition-colors ${labelFilter === 'labeled' ? 'bg-white shadow-sm font-medium text-[#333]' : 'text-[#777] hover:bg-[#e8e8e6]'}`} onClick={() => { setLabelFilter(labelFilter === 'labeled' ? 'all' : 'labeled'); setFilteredIdx(0); setMangaStartIndex(null); }}>Labellisé</button>
            <button className={`flex-1 text-[11px] py-[4px] rounded-[4px] transition-colors ${labelFilter === 'unlabeled' ? 'bg-white shadow-sm font-medium text-[#333]' : 'text-[#777] hover:bg-[#e8e8e6]'}`} onClick={() => { setLabelFilter(labelFilter === 'unlabeled' ? 'all' : 'unlabeled'); setFilteredIdx(0); setMangaStartIndex(null); }}>Sans label</button>
          </div>
          <button className={`mt-[2px] text-[11px] py-[5px] rounded-[6px] border-[0.5px] flex justify-center items-center gap-1 transition-all ${(labelFilter !== 'all' || colorFilter !== 'all') ? 'border-[#ddd] bg-white text-[#555] hover:bg-[#f9f9f9]' : 'border-transparent bg-transparent text-[#bbb] cursor-default'}`} onClick={() => { setLabelFilter('all'); setColorFilter('all'); setFilteredIdx(0); setMangaStartIndex(null); }} disabled={labelFilter === 'all' && colorFilter === 'all'}>
            ↻ Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Raccourcis Clavier & Catégories */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-[14px] pb-[10px] border-b-[0.5px] border-[#eee] bg-[#fafafa]">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-[#888] mb-[10px]">Clavier (AZERTY)</div>
          
          {/* Mini-Clavier Visuel Complet */}
          <div className="flex flex-col gap-[4px] bg-[#eaeaea] py-[14px] px-[10px] rounded-[8px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border-[0.5px] border-[#d5d5d5] mb-[12px]">
            <div className="w-max mx-auto flex flex-col gap-[4px]">
              <KeyboardRow 
                keys={ROW1} 
                offsetClass="ml-0" 
                currentLabel={currentLabel} 
                mangaStartIndex={mangaStartIndex} 
                handleAnnotate={handleAnnotate} 
              />
              {/* Ajustement des offsets pour correspondre aux touches réduites */}
              <KeyboardRow 
                keys={ROW2} 
                offsetClass="ml-[9px]" 
                currentLabel={currentLabel} 
                mangaStartIndex={mangaStartIndex} 
                handleAnnotate={handleAnnotate} 
              />
              <KeyboardRow 
                keys={ROW3} 
                offsetClass="ml-[22px]" 
                currentLabel={currentLabel} 
                mangaStartIndex={mangaStartIndex} 
                handleAnnotate={handleAnnotate} 
              />
            </div>
          </div>

          {/* Action Rapide : Manga */}
          <button
            onClick={fillRemainingWithManga}
            disabled={labeledCount === totalCount}
            className={`w-full flex justify-center items-center gap-2 px-[12px] py-[8px] rounded-[6px] transition-all duration-150 border-[0.5px] text-[11px] font-medium ${
              labeledCount === totalCount 
                ? 'border-[#e0e0e0] bg-[#f5f5f5] text-[#bbb] cursor-default'
                : 'border-[#93C5FD] bg-[#EFF6FF] text-[#2563EB] cursor-pointer hover:bg-[#DBEAFE] hover:border-[#60A5FA]'
            }`}
          >
            <span>🚀 Remplir le reste en Manga</span>
          </button>
        </div>

        {/* Légende scindée par fréquence */}
        <div className="flex-1 overflow-y-auto px-4 py-px">
          <div className="flex gap-[12px]">
            <LabelList 
              hotkeys={ERGO_KEYS} 
              // title="Repos (ZQSD)" 
              currentLabel={currentLabel} 
              mangaStartIndex={mangaStartIndex} 
              handleAnnotate={handleAnnotate} 
            />
            <div className="w-px bg-[#eee] self-stretch rounded-full" />
            <LabelList 
              hotkeys={MNEMO_KEYS} 
              // title="Rares (Mnémo)" 
              currentLabel={currentLabel} 
              mangaStartIndex={mangaStartIndex} 
              handleAnnotate={handleAnnotate} 
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="py-[8px] px-4 text-[11px] font-medium text-[#888] border-t-[0.5px] border-[#eee] text-center min-h-[32px] bg-[#fcfcfc]">
        {saveStatus}
      </div>

    </div>
  );
}