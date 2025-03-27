import React from 'react';

interface TimePeriodFilterProps {
  activePeriod: string | null;
  onSelectPeriod: (period: string | null) => void;
}

// Time period definitions with date ranges
export const TIME_PERIODS = {
  CONTEMPORARY: { 
    name: 'Contemporary', 
    range: [1950, new Date().getFullYear()],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3H21V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 17V21H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 21H3V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 7V3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="8" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="5" width="3" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  },
  MODERN: { 
    name: 'Modern', 
    range: [1750, 1949],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8.5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 11.5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 14V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 16.5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M18 8.5C18 6.567 17.1571 5 16.1571 5C15.1571 5 14 6 14 7.5C14 9 12.5 10 10.5 10C8.5 10 6 12 6 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 19H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  MEDIEVAL: { 
    name: 'Medieval', 
    range: [500, 1749],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 9H19V19H5V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 4L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 4L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 4L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 14V14C9 12.8954 9.89543 12 11 12H13C14.1046 12 15 12.8954 15 14V19H9V14Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 19H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  ANCIENT: { 
    name: 'Ancient', 
    range: [-3000, 499],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 9H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
};

export type TimePeriodKey = keyof typeof TIME_PERIODS;

const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({ 
  activePeriod, 
  onSelectPeriod 
}) => {
  return (
    <div className="time-period-filter">
      <div className="filter-container">
        {Object.entries(TIME_PERIODS).map(([key, period]) => (
          <button
            key={key}
            className={`filter-button ${activePeriod === key ? 'active' : ''}`}
            onClick={() => onSelectPeriod(activePeriod === key ? null : key)}
            aria-pressed={activePeriod === key}
          >
            <div className="filter-button-content">
              <span className="filter-icon">
                {period.icon}
              </span>
              <div className="filter-text-container">
                <span className="filter-text">{period.name}</span>
                <span className="filter-year-range">
                  {period.range[0]} — {period.range[1]}
                </span>
              </div>
            </div>
            <span className="filter-indicator"></span>
          </button>
        ))}
      </div>
      
      {activePeriod && (
        <div className="reset-button-container">
          <button 
            className="reset-filter-button"
            onClick={() => onSelectPeriod(null)}
            aria-label="Return to all periods"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="reset-icon-svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 3V7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TimePeriodFilter; 