import 'dotenv/config';
import app from './src/app.js';
import runMigrations from './src/config/database.js';

const PORT = process.env.PORT || 8080;

async function startApp() {
    try {
        await runMigrations();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor iniciado na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar a aplicação:', error);
        process.exit(1);
    }
}

startApp();
