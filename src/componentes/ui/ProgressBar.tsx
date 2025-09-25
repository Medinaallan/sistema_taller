import React, { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';

interface ProgressBarProps {
  isVisible: boolean;
  duration?: number; // duración en ms
  message?: string;
  onComplete?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  isVisible,
  duration = 3000,
  message = "Procesando archivo...",
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const messages = [
      "Leyendo archivo Excel...",
      "Validando formato...",
      "Procesando datos de clientes...",
      "Procesando datos de vehículos...",
      "Preparando vista previa..."
    ];

    let messageIndex = 0;
    const messageInterval = duration / messages.length;
    let progressInterval: NodeJS.Timeout;
    let messageTimeout: NodeJS.Timeout;

    // Actualizar progreso
    const updateProgress = () => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 50));
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          if (onComplete) {
            setTimeout(onComplete, 200);
          }
          return 100;
        }
        return newProgress;
      });
    };

    // Actualizar mensajes
    const updateMessage = () => {
      if (messageIndex < messages.length) {
        setCurrentMessage(messages[messageIndex]);
        messageIndex++;
        messageTimeout = setTimeout(updateMessage, messageInterval);
      }
    };

    // Iniciar intervalos
    progressInterval = setInterval(updateProgress, 50);
    updateMessage();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageTimeout);
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {/* Icono animado */}
          <div className="flex justify-center">
            <div className="relative">
              <FileText className="w-12 h-12 text-blue-600" />
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute -top-1 -right-1" />
            </div>
          </div>

          {/* Mensaje actual */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Cargando archivo
            </h3>
            <p className="text-sm text-gray-600 min-h-[20px]">
              {currentMessage}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  transform: progress < 100 ? 'translateX(0)' : 'translateX(0)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{Math.round(progress)}%</span>
              <span>{Math.ceil((duration - (progress * duration / 100)) / 1000)}s</span>
            </div>
          </div>

          {/* Indicador de pulso */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;