const csvService = require('./services/csvService');

async function debugClientData() {
    console.log('🔍 DEBUGGING CLIENT DATA\n');
    
    try {
        // Leer datos directamente del CSV
        const clients = await csvService.readCSV('clients', 'clients.csv');
        
        console.log('📊 DATOS DEL CSV:');
        console.log(`Total clientes: ${clients.length}\n`);
        
        // Buscar específicamente a marvin garcia
        const marvin = clients.find(c => c.email === 'mgarcia@taller.com');
        
        if (marvin) {
            console.log('🎯 CLIENTE MARVIN GARCIA ENCONTRADO:');
            console.log('ID:', marvin.id);
            console.log('Name:', marvin.name);
            console.log('Email:', marvin.email);
            console.log('Password Hash:', marvin.password_hash);
            console.log('Phone:', marvin.phone);
            console.log('Address:', marvin.address);
            console.log('Status:', marvin.status);
            console.log('');
        } else {
            console.log('❌ CLIENTE MARVIN GARCIA NO ENCONTRADO');
            console.log('Emails disponibles:');
            clients.forEach(c => console.log(`  - ${c.email}`));
        }
        
        // Mostrar todos los clientes para debug
        console.log('📋 TODOS LOS CLIENTES:');
        clients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.name} (${client.email}) - Password: ${client.password_hash}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugClientData();