const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { checkUrl } = require('./lib/checker');
const authRoutes = require('./routes/auth');
const landingRoutes = require('./routes/landings');

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/landings', landingRoutes);

const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Auto-check cada 15 minutos
async function autoCheckAll() {
  try {
    const landings = await prisma.landing.findMany();
    console.log(`[${new Date().toISOString()}] Auto-check: ${landings.length} landings`);
    for (const landing of landings) {
      try {
        const urlResult = await checkUrl(landing.url);
        await prisma.checkLog.create({
          data: { landingId: landing.id, statusCode: urlResult.statusCode, responseMs: urlResult.responseMs, isUp: urlResult.isUp, error: urlResult.error },
        });
        await prisma.landing.update({
          where: { id: landing.id },
          data: { ultimoCheck: new Date(), ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN', ultimoCodigo: urlResult.statusCode, ultimoMs: urlResult.responseMs },
        });
      } catch (err) {
        console.error(`Error checking ${landing.url}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Auto-check error:', err.message);
  }
}

setInterval(autoCheckAll, 15 * 60 * 1000);
// Primer check a los 30 segundos de iniciar el server
setTimeout(autoCheckAll, 30000);
