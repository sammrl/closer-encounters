import React, { useState, useEffect, useRef } from 'react';

interface YearSliderProps {
  minYear: number;
  maxYear: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const YearSlider: React.FC<YearSliderProps> = ({ 
  minYear,
  maxYear,
  value,
  onChange
}) => {
  const [startYear, setStartYear] = useState<number>(value[0]);
  const [endYear, setEndYear] = useState<number>(value[1]);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [startInputValue, setStartInputValue] = useState<string>(value[0].toString());
  const [endInputValue, setEndInputValue] = useState<string>(value[1].toString());
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isEndFocused, setIsEndFocused] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const totalYears = maxYear - minYear;
  
  // Update local state when props change
  useEffect(() => {
    setStartYear(value[0]);
    setEndYear(value[1]);
    setStartInputValue(value[0].toString());
    setEndInputValue(value[1].toString());
  }, [value]);
  
  // Get slider percentage based on year
  const getPercentage = (year: number) => {
    return ((year - minYear) / totalYears) * 100;
  };
  
  // Get year based on slider percentage
  const getYearFromPercentage = (percentage: number) => {
    return Math.round((percentage / 100) * totalYears + minYear);
  };
  
  // Handle slider thumb mouse down
  const handleMouseDown = (isStart: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (isStart) {
      setIsDraggingStart(true);
    } else {
      setIsDraggingEnd(true);
    }
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!sliderRef.current || (!isDraggingStart && !isDraggingEnd)) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newYear = getYearFromPercentage(percentage);
    
    if (isDraggingStart) {
      if (newYear < endYear) {
        setStartYear(newYear);
        setStartInputValue(newYear.toString());
      }
    } else if (isDraggingEnd) {
      if (newYear > startYear) {
        setEndYear(newYear);
        setEndInputValue(newYear.toString());
      }
    }
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    if (isDraggingStart || isDraggingEnd) {
      onChange([startYear, endYear]);
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    }
  };
  
  // Add global event listeners for mouse move and up
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, startYear, endYear]);
  
  // Handle start year input change
  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartInputValue(e.target.value);
  };
  
  // Handle end year input change
  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndInputValue(e.target.value);
  };
  
  // Apply start year input on blur
  const handleStartInputBlur = () => {
    setIsStartFocused(false);
    const parsed = parseInt(startInputValue);
    
    if (!isNaN(parsed) && parsed >= minYear && parsed < endYear) {
      setStartYear(parsed);
      onChange([parsed, endYear]);
    } else {
      setStartInputValue(startYear.toString());
    }
  };
  
  // Apply end year input on blur
  const handleEndInputBlur = () => {
    setIsEndFocused(false);
    const parsed = parseInt(endInputValue);
    
    if (!isNaN(parsed) && parsed <= maxYear && parsed > startYear) {
      setEndYear(parsed);
      onChange([startYear, parsed]);
    } else {
      setEndInputValue(endYear.toString());
    }
  };
  
  // Apply input on Enter key
  const handleKeyDown = (isStart: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isStart) {
        handleStartInputBlur();
      } else {
        handleEndInputBlur();
      }
    }
  };
  
  // Calculate years to display as markers
  const getYearMarkers = () => {
    // Only show the years at the current slider positions
    return [
      { year: startYear, percentage: getPercentage(startYear) },
      { year: endYear, percentage: getPercentage(endYear) }
    ];
  };
  
  const yearMarkers = getYearMarkers();
  
  return (
    <div className="custom-year-slider">
      <div className="year-slider-inputs">
        <div className="year-input-container">
          <label className="year-input-label">From</label>
          <input
            type="text"
            className={`year-input ${isStartFocused ? 'focused' : ''}`}
            value={startInputValue}
            onChange={handleStartInputChange}
            onFocus={() => setIsStartFocused(true)}
            onBlur={handleStartInputBlur}
            onKeyDown={handleKeyDown(true)}
          />
        </div>
        <div className="year-input-container">
          <label className="year-input-label">To</label>
          <input
            type="text"
            className={`year-input ${isEndFocused ? 'focused' : ''}`}
            value={endInputValue}
            onChange={handleEndInputChange}
            onFocus={() => setIsEndFocused(true)}
            onBlur={handleEndInputBlur}
            onKeyDown={handleKeyDown(false)}
          />
        </div>
      </div>
      
      <div className="year-slider-track-container" ref={sliderRef}>
        <div className="year-slider-track">
          <div 
            className="year-slider-progress"
            style={{
              left: `${getPercentage(startYear)}%`,
              width: `${getPercentage(endYear) - getPercentage(startYear)}%`
            }}
          />
          
          {/* Start Thumb */}
          <div 
            className={`year-slider-thumb start ${isDraggingStart ? 'active' : ''}`}
            style={{ left: `${getPercentage(startYear)}%` }}
            onMouseDown={handleMouseDown(true)}
          />
          
          {/* End Thumb */}
          <div 
            className={`year-slider-thumb end ${isDraggingEnd ? 'active' : ''}`}
            style={{ left: `${getPercentage(endYear)}%` }}
            onMouseDown={handleMouseDown(false)}
          />
          
          {/* Year Markers */}
          <div className="year-slider-markers">
            {yearMarkers.map((marker) => (
              <div 
                key={marker.year} 
                className="year-slider-marker"
                style={{ left: `${marker.percentage}%` }}
              >
                <div className="year-slider-marker-line" />
                <div className="year-slider-marker-year">{marker.year}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearSlider; 