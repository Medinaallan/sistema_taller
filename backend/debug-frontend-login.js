// Script de debug para el login del frontend
const API_BASE_URL = 'http://localhost:8080/api';

async function debugFrontendLogin() {
    console.log('🔍 DEBUGGING FRONTEND LOGIN');
    console.log('============================\n');
    
    try {
        // 1. Obtener clientes desde la API (igual que hace el frontend)
        console.log('📡 1. Obteniendo clientes desde API...');
        const response = await fetch(`${API_BASE_URL}/clients`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('❌ API no exitosa:', data);
            return;
        }
        
        console.log(`✅ API exitosa. Clientes obtenidos: ${data.data.length}\n`);
        
        // 2. Mapear datos igual que hace BaseDatosJS.ts
        console.log('🔄 2. Mapeando datos igual que el frontend...');
        const clientesConvertidos = data.data.map((cliente) => ({
            id: cliente.id,
            name: cliente.name,
            email: cliente.email,
            phone: cliente.phone,
            address: cliente.address,
            password: cliente.password_hash || '', // ⭐ CLAVE: mapear password_hash a password
            vehicles: [],
            createdAt: new Date(cliente.created_at || cliente.registration_date || new Date()),
            updatedAt: new Date(cliente.updated_at || new Date())
        }));
        
        console.log(`✅ Datos mapeados: ${clientesConvertidos.length} clientes\n`);
        
        // 3. Buscar a marvin garcia
        console.log('🔍 3. Buscando cliente marvin garcia...');
        const targetEmail = 'mgarcia@taller.com';
        const targetPassword = 'asdf1234';
        
        console.log(`Buscando: email="${targetEmail}" password="${targetPassword}"`);
        
        const marvin = clientesConvertidos.find(c => c.email === targetEmail);
        
        if (!marvin) {
            console.error('❌ Cliente no encontrado por email');
            console.log('Emails disponibles:');
            clientesConvertidos.forEach(c => console.log(`  - ${c.email}`));
            return;
        }
        
        console.log('✅ Cliente encontrado por email:');
        console.log(`   ID: ${marvin.id}`);
        console.log(`   Name: ${marvin.name}`);
        console.log(`   Email: ${marvin.email}`);
        console.log(`   Password: "${marvin.password}"`);
        console.log(`   Phone: ${marvin.phone}`);
        console.log('');
        
        // 4. Probar autenticación igual que el frontend
        console.log('🔐 4. Probando autenticación...');
        console.log(`Comparando: "${marvin.password}" === "${targetPassword}"`);
        
        if (marvin.password === targetPassword) {
            console.log('✅ ¡AUTENTICACIÓN EXITOSA!');
            console.log('El cliente SÍ puede hacer login');
        } else {
            console.log('❌ AUTENTICACIÓN FALLIDA');
            console.log(`Password esperado: "${targetPassword}"`);
            console.log(`Password encontrado: "${marvin.password}"`);
            console.log(`Coinciden: ${marvin.password === targetPassword}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Ejecutar si es Node.js
if (typeof window === 'undefined') {
    // Instalar fetch para Node.js si no existe
    if (typeof fetch === 'undefined') {
        const { default: fetch } = await import('node-fetch');
        global.fetch = fetch;
    }
    debugFrontendLogin();
}

// Exportar para uso en browser
if (typeof window !== 'undefined') {
    window.debugFrontendLogin = debugFrontendLogin;
}