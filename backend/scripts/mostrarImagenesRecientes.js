const spacesService = require('../services/spacesService');

async function mostrarImagenesRecientes() {
    try {
        console.log('🔍 Buscando imágenes recientes...\n');
        
        const files = await spacesService.listImages('chat-images', 10);
        
        if (files.length === 0) {
            console.log(' No se encontraron imágenes en chat-images/');
            return;
        }
        
        // Ordenar por fecha más reciente
        const sortedFiles = files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        console.log(' IMAGENES SUBIDAS JSJS:\n');
        
        sortedFiles.forEach((file, index) => {
            const fecha = new Date(file.lastModified);
            const fechaLocal = fecha.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            console.log(`${index + 1}.  ${file.key.replace('chat-images/', '')}`);
            console.log(`    Subida: ${fechaLocal}`);
            console.log(`    Tamaño: ${(file.size / 1024).toFixed(1)} KB`);
            console.log(`    URL: ${file.url}`);
            console.log('   ─────────────────────────────────────────────────────────');
        });
        
        console.log(`\n Total: ${files.length} imágenes encontradas`);
        
    } catch (error) {
        console.error(' Error:', error.message);
    }
}

mostrarImagenesRecientes();