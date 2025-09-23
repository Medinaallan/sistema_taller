const AWS = require('aws-sdk');

// Configuración para Digital Ocean Spaces
const spacesEndpoint = new AWS.Endpoint('https://nyc3.digitaloceanspaces.com');

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: 'DO801RTABW9NPETG9K6G',
    secretAccessKey: 'PyWW/IqIGU8Vllcp8/bEtTveh5ClWLxzqSWHQVB7u4o',
    region: 'nyc3', // Digital Ocean Spaces usa regiones similares a AWS
    s3ForcePathStyle: false, // Configura el estilo de URL
    signatureVersion: 'v4',
    // Corregir problemas de tiempo en Windows
    correctClockSkew: true,
    systemClockOffset: 0
});

const BUCKET_NAME = 'taller-develop';
const CDN_ENDPOINT = 'https://taller-develop.nyc3.cdn.digitaloceanspaces.com';

module.exports = {
    s3,
    BUCKET_NAME,
    CDN_ENDPOINT
};