import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIME_PERIODS, TimePeriodKey } from './TimePeriodFilter';
import YearSlider from './YearSlider';

// Filter interface
export interface FilterOptions {
  // Time period filter
  timePeriod: TimePeriodKey | null;
  customDateRange: [number, number] | null;
  
  // Encounter type filter
  encounterTypes: {
    nocturnalLights: boolean;
    daylightDiscs: boolean;
    radarVisual: boolean;
    ce1: boolean; // CE-1 (Visual UFO, Close Proximity)
    ce2: boolean; // CE-2 (UFO with Physical Effects/Traces)
    ce3: boolean; // CE-3 (Entities/Beings Observed)
    ce3A: boolean; // CE-3/A (Entity observed; no interaction)
    ce3B: boolean; // CE-3/B (Entity observed; limited interaction)
    ce3C: boolean; // CE-3/C (Entity observed; clear interaction)
    ce3D: boolean; // CE-3/D (Entity observed; abduction)
    ce3E: boolean; // CE-3/E (Entity observed; lasting impact)
    ce3F: boolean; // CE-3/F (Entity observed; entity injury/death)
    ce4: boolean; // CE-4 (Explicit Abduction Experience)
  };
  
  // Credibility filter
  credibilityRating: number;
  
  // Craft shape filter
  craftShapes: {
    saucer: boolean;
    triangle: boolean;
    sphere: boolean;
    cylindrical: boolean;
    unknown: boolean;
    other: boolean;
  };
}

// Tooltip definitions for Hynek Scale
export const hynekTooltips = {
  nocturnalLights: "Anomalous illuminations observed at night at distances exceeding 500 feet. Distinguished by movement patterns and visual characteristics inconsistent with conventional aircraft, celestial bodies, or known atmospheric phenomena.",
  daylightDiscs: "Clearly defined objects observed during daylight hours, exhibiting non-conventional aerodynamic properties. Despite the term 'disc,' these may appear as saucers, cigar shapes, triangles, or other geometric forms with distinct structural features.",
  radarVisual: "Concurrent detection of anomalous aerial phenomena by both radar equipment and human observers. These cases provide multi-sensory confirmation and instrumental data recording, offering significant technical validation of the observed phenomena.",
  ce1: "Clearly observed UFO at close range (~500 ft or less), detailed visual description, no interaction or physical traces.",
  ce2: "UFO observed clearly with any physical evidence, traces, or measurable impact on environment or witnesses.",
  ce3: "Clearly observed entities or beings in direct association with UFO craft; humanoids or unknown beings explicitly documented.",
  ce3A: "Clearly observed entity or humanoid being(s), explicitly reported; no interaction.",
  ce3B: "Limited explicit interaction or communication attempts clearly reported between observer and entity.",
  ce3C: "Explicit and clear interaction, contact, or verbal/nonverbal communication clearly reported between entity/entities and observers.",
  ce3D: "Clearly reported experience involving temporary abduction or forced boarding explicitly documented by witnesses.",
  ce3E: "Entity encounter clearly resulting in lasting physiological or psychological impacts explicitly documented by observers.",
  ce3F: "Entity clearly documented as injured or deceased explicitly during encounter event.",
  ce4: "Clear and explicitly documented abduction report, including explicit narrative of entities taking witnesses aboard a UFO craft."
};

// Default filter state
export const defaultFilters: FilterOptions = {
  timePeriod: null,
  customDateRange: null,
  encounterTypes: {
    nocturnalLights: false,
    daylightDiscs: false,
    radarVisual: false,
    ce1: false,
    ce2: false,
    ce3: false,
    ce3A: false,
    ce3B: false,
    ce3C: false,
    ce3D: false,
    ce3E: false,
    ce3F: false,
    ce4: false
  },
  credibilityRating: 0,
  craftShapes: {
    saucer: false,
    triangle: false,
    sphere: false,
    cylindrical: false,
    unknown: false,
    other: false
  }
};

// Animation variants
const panelVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
  }
};

const iconVariants = {
  initial: { rotate: 0 },
  active: { rotate: 90, transition: { duration: 0.3 } }
};

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filters, 
  onFilterChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(!!filters.customDateRange);
  
  // Helper to count active filters
  const countActiveFilters = (): number => {
    let count = 0;
    
    // Time period or custom date range
    if (filters.timePeriod || filters.customDateRange) count++;
    
    // Encounter types
    if (Object.values(filters.encounterTypes).some(v => v)) count++;
    
    // Credibility rating
    if (filters.credibilityRating > 0) count++;
    
    // Craft shapes
    if (Object.values(filters.craftShapes).some(v => v)) count++;
    
    return count;
  };
  
  // Handle time period selection
  const handleTimePeriodSelect = (period: TimePeriodKey | null) => {
    // If selecting a predefined period, reset custom date range
    onFilterChange({
      ...filters,
      timePeriod: period,
      customDateRange: null
    });
    setShowCustomRange(false);
  };
  
  // Handle encounter type toggle
  const handleEncounterTypeToggle = (type: keyof FilterOptions['encounterTypes']) => {
    onFilterChange({
      ...filters,
      encounterTypes: {
        ...filters.encounterTypes,
        [type]: !filters.encounterTypes[type]
      }
    });
  };
  
  // Handle CE-3 parent checkbox toggle
  const handleCE3Toggle = () => {
    const newCE3Value = !filters.encounterTypes.ce3;
    
    // If CE-3 is being checked, we don't change the children
    // If CE-3 is being unchecked, uncheck all children
    const ce3Children = newCE3Value 
      ? {
          ce3A: filters.encounterTypes.ce3A,
          ce3B: filters.encounterTypes.ce3B,
          ce3C: filters.encounterTypes.ce3C,
          ce3D: filters.encounterTypes.ce3D,
          ce3E: filters.encounterTypes.ce3E,
          ce3F: filters.encounterTypes.ce3F,
        }
      : {
          ce3A: false,
          ce3B: false,
          ce3C: false,
          ce3D: false,
          ce3E: false,
          ce3F: false,
        };
    
    onFilterChange({
      ...filters,
      encounterTypes: {
        ...filters.encounterTypes,
        ce3: newCE3Value,
        ...ce3Children
      }
    });
  };
  
  // Handle tooltip display
  const handleTooltipToggle = (tooltipKey: string | null) => {
    setActiveTooltip(tooltipKey);
  };
  
  // Handle credibility rating change
  const handleCredibilityChange = (value: number) => {
    onFilterChange({
      ...filters,
      credibilityRating: value
    });
  };
  
  // Handle craft shape toggle
  const handleCraftShapeToggle = (shape: keyof FilterOptions['craftShapes']) => {
    onFilterChange({
      ...filters,
      craftShapes: {
        ...filters.craftShapes,
        [shape]: !filters.craftShapes[shape]
      }
    });
  };
  
  // Handle custom date range changes
  const handleCustomDateRangeChange = (range: [number, number]) => {
    onFilterChange({
      ...filters,
      customDateRange: range,
      // Clear predefined time period when using custom range
      timePeriod: null
    });
  };
  
  // Toggle custom range visibility
  const handleCustomRangeToggle = () => {
    setShowCustomRange(!showCustomRange);
    if (!showCustomRange && !filters.customDateRange) {
      // If opening custom range and none is set, initialize with a default range
      onFilterChange({
        ...filters,
        customDateRange: [-3000, 2025],
        timePeriod: null
      });
    }
  };
  
  // Handle reset all filters
  const handleResetFilters = () => {
    onFilterChange(defaultFilters);
    setShowCustomRange(false);
  };
  
  // Calculate if any filters are active
  const hasActiveFilters = countActiveFilters() > 0;
  const activeFilterCount = countActiveFilters();
  
  return (
    <div className="filter-panel">
      {/* Filter Icon Button */}
      <motion.button 
        className={`filter-icon-button ${hasActiveFilters ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle filters"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial="initial"
        animate={isExpanded ? "active" : "initial"}
      >
        <motion.svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          variants={iconVariants}
        >
          <path d="M4 6H20M8 12H16M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
        
        {/* Active filter badge */}
        {activeFilterCount > 0 && (
          <motion.span 
            className="filter-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {activeFilterCount}
          </motion.span>
        )}
      </motion.button>
      
      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="filter-options-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="filter-panel-header">FILTER OPTIONS</div>
            
            {/* Time Period Filter Section */}
            <div className="filter-section">
              <div className="filter-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 10H4V20H20V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 4L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 4L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 4L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                TIME PERIOD
              </div>
              
              <div className="filter-time-periods">
                {Object.entries(TIME_PERIODS).map(([key, period]) => (
                  <label key={key} className="radio-button-container">
                    <input
                      type="radio"
                      checked={filters.timePeriod === key}
                      onChange={() => handleTimePeriodSelect(key as TimePeriodKey)}
                      name="timePeriod"
                      className="radio-input"
                    />
                    <span className="radio-label">
                      {period.name} <span className="year-range">({period.range[0]}–{period.range[1]})</span>
                    </span>
                  </label>
                ))}
                
                {/* Custom Range Toggle */}
                <motion.button
                  className={`custom-range-button ${showCustomRange ? 'active' : ''}`}
                  onClick={handleCustomRangeToggle}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="custom-range-icon">
                    {showCustomRange ? '−' : '+'}
                  </span>
                  <span className="custom-range-text">
                    {showCustomRange ? 'Hide custom range' : 'Custom date range'}
                  </span>
                </motion.button>
                
                {/* Custom Year Range Slider */}
                <AnimatePresence>
                  {showCustomRange && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <YearSlider
                        minYear={-3000}
                        maxYear={2025}
                        value={filters.customDateRange || [-3000, 2025]}
                        onChange={handleCustomDateRangeChange}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Encounter Type Filter Section */}
            <div className="filter-section">
              <div className="filter-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 22L15 16M6 22L9 16M15 16H9L12 8L15 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ENCOUNTER TYPE (Hynek Scale)
              </div>
              
              <div className="filter-checkboxes">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.nocturnalLights}
                    onChange={() => handleEncounterTypeToggle('nocturnalLights')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">Nocturnal Lights</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('nocturnalLights')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about Nocturnal Lights"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'nocturnalLights' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.nocturnalLights}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.daylightDiscs}
                    onChange={() => handleEncounterTypeToggle('daylightDiscs')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">Daylight Discs</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('daylightDiscs')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about Daylight Discs"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'daylightDiscs' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.daylightDiscs}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.radarVisual}
                    onChange={() => handleEncounterTypeToggle('radarVisual')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">Radar-Visual Cases</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('radarVisual')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about Radar-Visual Cases"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'radarVisual' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.radarVisual}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                {/* CE-1 */}
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.ce1}
                    onChange={() => handleEncounterTypeToggle('ce1')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">CE-1</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('ce1')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about CE-1"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'ce1' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.ce1}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                {/* CE-2 */}
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.ce2}
                    onChange={() => handleEncounterTypeToggle('ce2')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">CE-2</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('ce2')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about CE-2"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'ce2' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.ce2}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                {/* CE-3 */}
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.ce3}
                    onChange={() => handleCE3Toggle()}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">CE-3</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('ce3')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about CE-3"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'ce3' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.ce3}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                {/* CE-3 Subtypes */}
                <AnimatePresence>
                  {filters.encounterTypes.ce3 && (
                    <motion.div 
                      className="checkbox-nested-container"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* CE-3/A */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3A}
                          onChange={() => handleEncounterTypeToggle('ce3A')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/A</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3A')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/A"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3A' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3A}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                      
                      {/* CE-3/B */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3B}
                          onChange={() => handleEncounterTypeToggle('ce3B')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/B</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3B')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/B"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3B' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3B}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                      
                      {/* CE-3/C */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3C}
                          onChange={() => handleEncounterTypeToggle('ce3C')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/C</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3C')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/C"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3C' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3C}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                      
                      {/* CE-3/D */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3D}
                          onChange={() => handleEncounterTypeToggle('ce3D')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/D</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3D')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/D"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3D' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3D}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                      
                      {/* CE-3/E */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3E}
                          onChange={() => handleEncounterTypeToggle('ce3E')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/E</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3E')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/E"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3E' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3E}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                      
                      {/* CE-3/F */}
                      <label className="checkbox-container nested-checkbox">
                        <span className="nested-indicator">┗</span>
                        <input
                          type="checkbox"
                          checked={filters.encounterTypes.ce3F}
                          onChange={() => handleEncounterTypeToggle('ce3F')}
                          className="checkbox-input"
                        />
                        <span className="checkbox-label">CE-3/F</span>
                        <button 
                          className="tooltip-icon"
                          onMouseEnter={() => handleTooltipToggle('ce3F')}
                          onMouseLeave={() => handleTooltipToggle(null)}
                          aria-label="Show information about CE-3/F"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'ce3F' && (
                            <motion.div 
                              className="tooltip-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {hynekTooltips.ce3F}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* CE-4 */}
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filters.encounterTypes.ce4}
                    onChange={() => handleEncounterTypeToggle('ce4')}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">CE-4</span>
                  <button 
                    className="tooltip-icon"
                    onMouseEnter={() => handleTooltipToggle('ce4')}
                    onMouseLeave={() => handleTooltipToggle(null)}
                    aria-label="Show information about CE-4"
                  >
                    <span className="info-icon">ⓘ</span>
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'ce4' && (
                      <motion.div 
                        className="tooltip-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hynekTooltips.ce4}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
              </div>
            </div>
            
            {/* Credibility Rating Filter Section */}
            <div className="filter-section">
              <div className="filter-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                CREDIBILITY RATING
              </div>
              
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={filters.credibilityRating}
                  onChange={(e) => handleCredibilityChange(parseInt(e.target.value))}
                  className="slider-input"
                />
                
                <div className="slider-labels">
                  <span className="slider-label-low">Low</span>
                  <span className="slider-label-value">{filters.credibilityRating > 0 ? filters.credibilityRating : 'Any'}</span>
                  <span className="slider-label-high">High</span>
                </div>
              </div>
            </div>
            
            {/* Craft Shape Filter Section */}
            <div className="filter-section">
              <div className="filter-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 10L4 5.5L8.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 5.5H17C19.2091 5.5 21 7.29086 21 9.5V9.5C21 11.7091 19.2091 13.5 17 13.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.5 23L20 18.5L15.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 18.5H7C4.79086 18.5 3 16.7091 3 14.5V14.5C3 12.2909 4.79086 10.5 7 10.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                CRAFT SHAPE
              </div>
              
              <div className="filter-shape-checkboxes">
                <div className="filter-shape-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.saucer}
                      onChange={() => handleCraftShapeToggle('saucer')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Saucer</span>
                  </label>
                  
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.triangle}
                      onChange={() => handleCraftShapeToggle('triangle')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Triangle</span>
                  </label>
                </div>
                
                <div className="filter-shape-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.sphere}
                      onChange={() => handleCraftShapeToggle('sphere')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Sphere</span>
                  </label>
                  
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.cylindrical}
                      onChange={() => handleCraftShapeToggle('cylindrical')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Cylindrical/cigar</span>
                  </label>
                </div>
                
                <div className="filter-shape-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.unknown}
                      onChange={() => handleCraftShapeToggle('unknown')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Unknown</span>
                  </label>
                  
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={filters.craftShapes.other}
                      onChange={() => handleCraftShapeToggle('other')}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">Other</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Filter Action Buttons */}
            <div className="filter-actions">
              <motion.button 
                className="filter-apply-button"
                onClick={() => setIsExpanded(false)}
                whileHover={{ y: -2, boxShadow: '0 0 20px rgba(56, 189, 248, 0.4), 0 6px 15px rgba(0, 0, 0, 0.2)' }}
                whileTap={{ y: 0, scale: 0.98 }}
              >
                APPLY FILTERS
              </motion.button>
              
              <motion.button 
                className="filter-reset-button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                whileHover={hasActiveFilters ? { y: -2 } : {}}
                whileTap={hasActiveFilters ? { y: 0, scale: 0.98 } : {}}
              >
                RESET
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;