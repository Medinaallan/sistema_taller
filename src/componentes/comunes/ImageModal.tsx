import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  imageUrl,
  altText = "Imagen del chat",
  onClose
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div className="relative max-w-screen-lg max-h-screen-lg w-full h-full flex items-center justify-center">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          aria-label="Cerrar imagen"
          title="Cerrar imagen (ESC)"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        {/* Imagen */}
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ userSelect: 'none' }}
          draggable={false}
        />

        {/* Información adicional */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-white text-sm bg-black bg-opacity-50 rounded px-3 py-1 inline-block">
            Presiona ESC o haz clic fuera de la imagen para cerrar
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
