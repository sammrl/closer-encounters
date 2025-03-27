import React, { useState, useEffect, useRef } from 'react';

interface TimeSliderProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  showAllSightings: boolean;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  minYear,
  maxYear,
  currentYear,
  onChange,
  isPlaying,
  onPlayToggle,
  showAllSightings,
  playbackSpeed = 1,
  onSpeedChange = () => {}
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Handle slider drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!trackRef.current) return;
    
    // Store the actual mouse X position for tooltip positioning
    setMouseX(e.clientX);
    
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(position, 1));
      setHoverPosition(clampedPosition);
    }
    
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Track specific hover for timeline track
  const [isTrackHovering, setIsTrackHovering] = useState(false);

  // Only set hovering state when mouse enters the track specifically
  const handleTrackMouseEnter = () => {
    setIsTrackHovering(true);
  };
  
  const handleTrackMouseLeave = () => {
    setIsTrackHovering(false);
    setHoverPosition(null);
    setMouseX(null);
  };
  
  // General timeline hovering
  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsTrackHovering(false);
    setHoverPosition(null);
    setMouseX(null);
  };

  // Update slider position
  const updateSliderPosition = (clientX: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(position, 1));
    
    const year = Math.round(minYear + clampedPosition * (maxYear - minYear));
    onChange(year);
  };

  // Set up mouse move and mouse up listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Add hover effect listeners - only for the track area itself
  useEffect(() => {
    if (isTrackHovering && trackRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (isTrackHovering) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isTrackHovering]);

  // Calculate the position of the handle
  const handlePosition = ((currentYear - minYear) / (maxYear - minYear)) * 100;

  // Calculate the preview year (when hovering)
  const hoverYear = hoverPosition !== null 
    ? Math.round(minYear + hoverPosition * (maxYear - minYear))
    : currentYear;

  // Format years for display (handle negative years/BCE)
  const formatYear = (year: number) => {
    if (year < 0) {
      return Math.abs(year);
    }
    return year;
  };
  
  // Add BCE suffix when needed
  const addEraSuffix = (year: number) => {
    if (year < 0) {
      return "BCE";
    }
    return "";
  };
  
  // Generate tick marks with dynamic spacing
  const generateTicks = () => {
    // Fixed number of ticks (5 always works well)
    const numTicks = 5;
    
    return Array.from({ length: numTicks }).map((_, index) => {
      const tick = minYear + Math.round((index / (numTicks - 1)) * (maxYear - minYear));
      const position = ((tick - minYear) / (maxYear - minYear)) * 100;
      const isCurrentYear = Math.abs(tick - currentYear) < 80; // Highlight current area
      
      return (
        <div 
          key={index} 
          className={`time-slider-tick ${isCurrentYear ? 'current-year' : ''}`} 
          style={{ left: `${position}%` }}
        >
          <div className="time-slider-tick-mark" />
          <div className="time-slider-tick-label">{formatYear(tick)} {tick < 0 ? 'BCE' : ''}</div>
        </div>
      );
    });
  };

  return (
    <div className={`time-slider-container ${showAllSightings ? 'visible' : 'hidden'}`}>
      <div className="time-slider-inner">
        <div 
          className="time-slider minimal-timeline" 
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Current year display */}
          <div className="time-slider-year-display">
            <div className="time-slider-current-year">
              {formatYear(currentYear)}
            </div>
            {currentYear < 0 && <div className="time-slider-era">BCE</div>}
          </div>
          
          {/* Playback Control Group */}
          <div className="playback-controls-group">
            {/* Slow Down Button */}
            <button 
              className={`time-slider-speed-button ${playbackSpeed <= 0.5 ? 'disabled' : ''}`}
              onClick={() => onSpeedChange(Math.max(0.5, playbackSpeed - 0.5))}
              aria-label="Slow Down"
              disabled={playbackSpeed <= 0.5}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 17L8.5 12L15.5 7V17Z" fill="currentColor" />
              </svg>
            </button>

            {/* Play button */}
            <button 
              className={`time-slider-play-button ${isPlaying ? 'playing' : ''}`}
              onClick={onPlayToggle}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4.75C6 4.04777 6.69692 3.55838 7.33078 3.88908L19.3308 10.1391C19.9852 10.4793 19.9852 11.5207 19.3308 11.8609L7.33078 18.1109C6.69692 18.4416 6 17.9522 6 17.25V4.75Z" fill="currentColor" />
                </svg>
              )}
            </button>
            
            {/* Speed Up Button */}
            <button 
              className={`time-slider-speed-button ${playbackSpeed >= 3 ? 'disabled' : ''}`}
              onClick={() => onSpeedChange(Math.min(3, playbackSpeed + 0.5))}
              aria-label="Speed Up"
              disabled={playbackSpeed >= 3}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 17V7L15.5 12L8.5 17Z" fill="currentColor" />
              </svg>
            </button>
            
            {/* Speed Indicator */}
            <div className="playback-speed-indicator">
              {playbackSpeed}x
            </div>
          </div>
          
          <div 
            className="time-slider-track-container"
            ref={trackRef}
            onMouseEnter={handleTrackMouseEnter}
            onMouseLeave={handleTrackMouseLeave}
          >
            {/* Hover year preview - positioned absolutely against window coordinates */}
            {isTrackHovering && mouseX !== null && hoverPosition !== null && hoverYear !== currentYear && trackRef.current && (
              <div 
                className="time-slider-preview-tooltip" 
                style={{ 
                  left: `${mouseX - trackRef.current.getBoundingClientRect().left}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatYear(hoverYear)} {hoverYear < 0 ? 'BCE' : ''}
              </div>
            )}
            
            <div className="time-slider-track">
              <div className="time-slider-progress" style={{ width: `${handlePosition}%` }} />
              
              {/* Hover preview line - aligned with cursor */}
              {isTrackHovering && mouseX !== null && hoverPosition !== null && !isDragging && trackRef.current && (
                <div 
                  className="time-slider-hover-line" 
                  style={{ 
                    left: `${mouseX - trackRef.current.getBoundingClientRect().left}px`,
                    transform: 'translateX(-50%)'
                  }} 
                />
              )}
              
              <div 
                className={`time-slider-handle ${isDragging ? 'active' : ''} ${isPlaying ? 'pulsing' : ''}`} 
                style={{ left: `${handlePosition}%` }} 
              />
            </div>
            
            <div className="time-slider-ticks">
              {generateTicks()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;