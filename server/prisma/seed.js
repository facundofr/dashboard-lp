const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaults = [
  { name: 'Cober', color: 'from-purple-600/80 to-pink-600/80' },
  { name: 'Bristol', color: 'from-blue-600/80 to-cyan-600/80' },
  { name: 'Medicals', color: 'from-emerald-600/80 to-teal-600/80' },
  { name: 'Centros Médicos', color: 'from-amber-600/80 to-orange-600/80' },
];

const defaultTemplates = [
  {
    name: 'Landing',
    icon: '🌐',
    description: 'Página web promocional con monitoreo de uptime y SSL',
    hasMonitoring: true,
    fields: [
      { name: 'url', label: 'URL', fieldType: 'url', required: true, sortOrder: 1, placeholder: 'https://...' },
      { name: 'cliente', label: 'Cliente', fieldType: 'text', sortOrder: 2, placeholder: 'Nombre del cliente' },
      { name: 'ftpHost', label: 'Host FTP', fieldType: 'text', sortOrder: 3, placeholder: 'ftp.ejemplo.com' },
      { name: 'ftpUser', label: 'Usuario FTP', fieldType: 'text', sortOrder: 4, placeholder: 'usuario' },
      { name: 'ftpPass', label: 'Contraseña FTP', fieldType: 'password', sortOrder: 5, placeholder: '••••••••' },
      { name: 'ftpPath', label: 'Ruta FTP', fieldType: 'text', sortOrder: 6, placeholder: '/public_html/' },
      { name: 'tecnologias', label: 'Tecnologías', fieldType: 'text', sortOrder: 7, placeholder: 'React, Tailwind, Node.js' },
      { name: 'imagenUrl', label: 'URL de imagen', fieldType: 'url', sortOrder: 8, placeholder: 'https://ejemplo.com/screenshot.jpg' },
      { name: 'sheetUrl', label: 'URL del Sheet', fieldType: 'url', sortOrder: 9, placeholder: 'https://docs.google.com/spreadsheets/...' },
      { name: 'tags', label: 'Tags', fieldType: 'text', sortOrder: 10, placeholder: 'premium, urgencia, redesign' },
      { name: 'notas', label: 'Notas', fieldType: 'textarea', sortOrder: 11, placeholder: 'Información adicional...' },
    ],
  },
  {
    name: 'Marca',
    icon: '🏢',
    description: 'Registro de marca comercial con datos de contacto y redes',
    hasMonitoring: false,
    fields: [
      { name: 'cliente', label: 'Cliente', fieldType: 'text', required: true, sortOrder: 1, placeholder: 'Nombre del titular' },
      { name: 'email', label: 'Email de contacto', fieldType: 'email', sortOrder: 2, placeholder: 'contacto@marca.com' },
      { name: 'telefono', label: 'Teléfono', fieldType: 'tel', sortOrder: 3, placeholder: '+54 11 5555-5555' },
      { name: 'redesSociales', label: 'Redes Sociales', fieldType: 'text', sortOrder: 4, placeholder: '@marca en Instagram, Facebook' },
      { name: 'direccion', label: 'Dirección', fieldType: 'text', sortOrder: 5, placeholder: 'Calle y número' },
      { name: 'notas', label: 'Notas', fieldType: 'textarea', sortOrder: 6, placeholder: 'Información adicional...' },
    ],
  },
  {
    name: 'Credencial',
    icon: '🔑',
    description: 'Credenciales de acceso a servicios, APIs o paneles',
    hasMonitoring: false,
    fields: [
      { name: 'servicio', label: 'Servicio', fieldType: 'text', required: true, sortOrder: 1, placeholder: 'Ej: AWS, Mailchimp, Shopify' },
      { name: 'usuario', label: 'Usuario', fieldType: 'text', sortOrder: 2, placeholder: 'usuario o email' },
      { name: 'password', label: 'Contraseña', fieldType: 'password', sortOrder: 3, placeholder: '••••••••' },
      { name: 'urlAcceso', label: 'URL de acceso', fieldType: 'url', sortOrder: 4, placeholder: 'https://admin.ejemplo.com' },
      { name: 'notas', label: 'Notas', fieldType: 'textarea', sortOrder: 5, placeholder: 'Instrucciones adicionales...' },
    ],
  },
];

async function main() {
  for (const cat of defaults) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color },
      create: cat,
    });
    console.log(`✓ Categoría: ${cat.name}`);
  }
  console.log('Categorías seeded');

  for (const tmpl of defaultTemplates) {
    const existing = await prisma.templateType.findUnique({ where: { name: tmpl.name } });
    if (existing) {
      console.log(`~ Template ya existe: ${tmpl.name}`);
      continue;
    }
    const created = await prisma.templateType.create({
      data: {
        name: tmpl.name,
        icon: tmpl.icon,
        description: tmpl.description,
        hasMonitoring: tmpl.hasMonitoring,
        fieldDefinitions: {
          create: tmpl.fields,
        },
      },
    });
    console.log(`✓ Template: ${created.name} (${created.fieldDefinitions?.length || tmpl.fields.length} campos)`);
  }
  console.log('Templates seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
