const { s3, BUCKET_NAME, CDN_ENDPOINT } = require('../config/spaces');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class SpacesService {
    /**
     * Sube una imagen a Digital Ocean Spaces
     * @param {Buffer} fileBuffer - Buffer del archivo
     * @param {string} originalName - Nombre original del archivo
     * @param {string} mimeType - Tipo MIME del archivo
     * @param {string} folder - Carpeta dentro del bucket (opcional)
     * @returns {Promise<Object>} Objeto con la URL y key del archivo
     */
    async uploadImage(fileBuffer, originalName, mimeType, folder = 'chat-images') {
        try {
            // Generar nombre único para el archivo
            const fileExtension = path.extname(originalName);
            const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
            const key = folder ? `${folder}/${fileName}` : fileName;

            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
                ACL: 'public-read', // Hace la imagen públicamente accesible
                CacheControl: 'max-age=31536000', // Cache por 1 año
            };

            const result = await s3.upload(uploadParams).promise();
            
            // Retornar URL del CDN para mejor performance
            const cdnUrl = `${CDN_ENDPOINT}/${key}`;
            
            return {
                success: true,
                url: cdnUrl,
                key: key,
                originalUrl: result.Location,
                fileName: fileName
            };
        } catch (error) {
            console.error('Error uploading to Spaces:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Elimina una imagen de Spaces
     * @param {string} key - Key del archivo en Spaces
     * @returns {Promise<Object>} Resultado de la operación
     */
    async deleteImage(key) {
        try {
            const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: key
            };

            await s3.deleteObject(deleteParams).promise();
            
            return {
                success: true,
                message: 'Image deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting from Spaces:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtiene una URL firmada para acceso temporal a una imagen privada
     * @param {string} key - Key del archivo en Spaces
     * @param {number} expiresIn - Tiempo de expiración en segundos (default: 3600)
     * @returns {Promise<string>} URL firmada
     */
    async getSignedUrl(key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: BUCKET_NAME,
                Key: key,
                Expires: expiresIn
            };

            const url = await s3.getSignedUrlPromise('getObject', params);
            return url;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    /**
     * Lista archivos en una carpeta específica
     * @param {string} folder - Nombre de la carpeta
     * @param {number} maxKeys - Número máximo de archivos a retornar
     * @returns {Promise<Array>} Lista de archivos
     */
    async listImages(folder = 'chat-images', maxKeys = 100) {
        try {
            const params = {
                Bucket: BUCKET_NAME,
                Prefix: folder + '/',
                MaxKeys: maxKeys
            };

            const result = await s3.listObjectsV2(params).promise();
            
            return result.Contents.map(item => ({
                key: item.Key,
                size: item.Size,
                lastModified: item.LastModified,
                url: `${CDN_ENDPOINT}/${item.Key}`
            }));
        } catch (error) {
            console.error('Error listing images:', error);
            throw error;
        }
    }

    /**
     * Migra una imagen local a Spaces
     * @param {string} localPath - Ruta local del archivo
     * @param {string} fileName - Nombre del archivo
     * @returns {Promise<Object>} Resultado de la migración
     */
    async migrateLocalImage(localPath, fileName) {
        try {
            const fs = require('fs');
            const mime = require('mime-types');
            
            // Leer archivo local
            const fileBuffer = fs.readFileSync(localPath);
            const mimeType = mime.lookup(localPath) || 'application/octet-stream';
            
            // Subir a Spaces
            const result = await this.uploadImage(fileBuffer, fileName, mimeType, 'migrated-images');
            
            if (result.success) {
                console.log(`Migrated: ${fileName} -> ${result.url}`);
            }
            
            return result;
        } catch (error) {
            console.error(`Error migrating ${fileName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new SpacesService();