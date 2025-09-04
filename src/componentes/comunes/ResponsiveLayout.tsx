import React from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  stats?: Array<{
    value: number | string;
    label: string;
  }>;
  gradient?: 'blue' | 'indigo' | 'orange' | 'green' | 'purple';
}

const gradientClasses = {
  blue: 'from-blue-500 to-blue-600',
  indigo: 'from-indigo-600 via-purple-600 to-blue-600',
  orange: 'from-orange-500 via-red-500 to-pink-500',
  green: 'from-green-500 to-emerald-600',
  purple: 'from-purple-500 to-violet-600',
};

export const ResponsivePageHeader: React.FC<ResponsivePageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  stats,
  gradient = 'blue'
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradientClasses[gradient]} rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className={`${actions ? 'mb-6 lg:mb-0' : ''}`}>
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{title}</h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg opacity-90">{subtitle}</p>
            </div>
          </div>
          
          {/* Stats responsivas */}
          {stats && stats.length > 0 && (
            <div className={`grid gap-3 sm:gap-4 mt-4 sm:mt-6 ${
              stats.length === 2 ? 'grid-cols-2' :
              stats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
              stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/80 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="w-full lg:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, lg: 3 },
  gap = 'gap-4 sm:gap-6',
  className = ''
}) => {
  const getGridClasses = () => {
    const classes = ['grid', gap];
    
    if (columns.xs) classes.push(`grid-cols-${columns.xs}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = true
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverClasses = hover ? 'hover:shadow-md' : '';

  return (
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-sm ${hoverClasses} transition-all duration-300 border border-gray-100 overflow-hidden ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default {
  ResponsivePageHeader,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard
};
