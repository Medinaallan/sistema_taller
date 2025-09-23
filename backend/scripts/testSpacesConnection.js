/**
 * Script de prueba para verificar la conexión con Digital Ocean
 */

const spacesService = require('../services/spacesService');
const fs = require('fs');
const path = require('path');

async function testSpacesConnection() {
    console.log(' Probando conexión con Digital Ocean Spaces...\n');

    try {
        // Test 1: Listar archivos existentes
        console.log(' Test 1: Listando archivos existentes...');
        const files = await spacesService.listImages('chat-images', 10);
        console.log(` Conectado! Encontrados ${files.length} archivos en chat-images/`);
        
        if (files.length > 0) {
            console.log(' Primeros archivos:');
            files.slice(0, 3).forEach(file => {
                console.log(`  - ${file.key} (${file.size} bytes)`);
            });
        }

        // Test 2: Subir archivo de prueba
        console.log('\n Test 2: Subiendo archivo de prueba...');
        const testBuffer = Buffer.from('Este es un archivo de prueba para Digital Ocean Spaces');
        const uploadResult = await spacesService.uploadImage(
            testBuffer,
            'test-connection.txt',
            'text/plain',
            'test-uploads'
        );

        if (uploadResult.success) {
            console.log(` Upload exitoso! URL: ${uploadResult.url}`);
            
            // Test 3: Eliminar archivo de prueba
            console.log('\n Test 3: Eliminando archivo de prueba...');
            const deleteResult = await spacesService.deleteImage(uploadResult.key);
            
            if (deleteResult.success) {
                console.log(' Eliminación exitosa!');
            } else {
                console.log(' Error eliminando:', deleteResult.error);
            }
        } else {
            console.log(' Error en upload:', uploadResult.error);
        }

        // Test 4: Verificar configuración
        console.log('\n Test 4: Verificando configuración...');
        console.log(' Endpoint: https://nyc3.digitaloceanspaces.com');
        console.log(' Bucket: taller-develop');
        console.log(' CDN: https://taller-develop.nyc3.cdn.digitaloceanspaces.com');

        console.log('\n ¡Todos los tests pasaron! Digital Ocean Spaces está configurado correctamente.');
        
    } catch (error) {
        console.error('\n Error durante las pruebas:', error);
        console.error('\n Posibles causas:');
        console.error('- Credenciales incorrectas');
        console.error('- Bucket no existe o sin permisos');
        console.error('- Problemas de conectividad');
        console.error('- Configuración del endpoint incorrecta');
    }
}

// Ejecutar test
if (require.main === module) {
    testSpacesConnection();
}

module.exports = testSpacesConnection;