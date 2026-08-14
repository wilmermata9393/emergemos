// ============================================================================
//  SEED — datos de prueba para desarrollo.
//  Crea un usuario administrador y un profesional de ejemplo para poder
//  iniciar sesión y probar el sistema. NO usar estas contraseñas en producción.
// ============================================================================

import * as dotenv from 'dotenv';
dotenv.config(); // carga el .env de la raíz (desde donde se ejecuta el script)

import { PrismaClient, UserRole, Discipline } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Cambiar123!', 12);

  // --- Administrador ---
  const admin = await prisma.user.upsert({
    where: { phone: '+17870000001' },
    update: {},
    create: {
      role: UserRole.ADMIN,
      phone: '+17870000001',
      email: 'admin@ejemplo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      mustChangePassword: true,
    },
  });

  // --- Profesional con NPI (puede recetar) ---
  const doctora = await prisma.user.upsert({
    where: { phone: '+17870000002' },
    update: {},
    create: {
      role: UserRole.PROVIDER,
      phone: '+17870000002',
      email: 'doctora@ejemplo.com',
      passwordHash,
      firstName: 'Ana',
      lastName: 'García',
      pronoun: 'ella',
      mustChangePassword: true,
      providerProfile: {
        create: {
          discipline: Discipline.CHIROPRACTIC,
          npi: '1234567890',
          hasNpi: true,
          canPrescribe: true,
          displayTitle: 'Dra. en Quiropráctica',
          bio: 'Especialista en salud de columna y bienestar.',
        },
      },
    },
  });

  await seedTemplates();
  await seedScheduling(doctora.id);
  await seedLabTests();
  await seedConsentDocuments();
  await seedInsurancePlans();

  console.log('Seed completado:');
  console.log('  Admin    -> teléfono +17870000001  clave: Cambiar123!');
  console.log('  Doctora  -> teléfono +17870000002  clave: Cambiar123!');
  console.log({ adminId: admin.id, doctoraId: doctora.id });
}

/// Plantillas de notas por disciplina (predefinidas del sistema).
async function seedTemplates() {
  const templates = [
    {
      id: 'tpl-internal-medicine',
      discipline: Discipline.INTERNAL_MEDICINE,
      name: 'Nota de Medicina Interna',
      description: 'Nota SOAP con plan de seguimiento y próxima cita.',
      schema: {
        sections: [
          { key: 'subjective', title: 'Notas del médico (Subjetivo)', type: 'textarea' },
          { key: 'objective', title: 'Objetivo / Examen físico', type: 'textarea' },
          { key: 'assessment', title: 'Evaluación', type: 'textarea' },
          { key: 'plan', title: 'Plan de seguimiento', type: 'textarea' },
          { key: 'followUp', title: 'Próxima cita', type: 'followUp' },
        ],
      },
    },
    {
      id: 'tpl-nutrition',
      discipline: Discipline.NUTRITION,
      name: 'Nota de Nutrición',
      description: 'Evaluación nutricional y prescripción de alimentos.',
      schema: {
        sections: [
          { key: 'assessment', title: 'Evaluación nutricional', type: 'textarea' },
          { key: 'foodPlan', title: 'Prescripción de alimentos', type: 'foodPrescription' },
          { key: 'recommendations', title: 'Recomendaciones', type: 'textarea' },
          { key: 'followUp', title: 'Próxima cita', type: 'followUp' },
        ],
      },
    },
    {
      id: 'tpl-chiropractic',
      discipline: Discipline.CHIROPRACTIC,
      name: 'Nota de Quiropráctica',
      description: 'Incluye diagrama del cuerpo para marcar el dolor.',
      schema: {
        sections: [
          { key: 'subjective', title: 'Motivo / Subjetivo', type: 'textarea' },
          { key: 'painMap', title: 'Mapa de dolor', type: 'bodyMap' },
          { key: 'assessment', title: 'Evaluación', type: 'textarea' },
          { key: 'treatment', title: 'Tratamiento realizado', type: 'textarea' },
          { key: 'followUp', title: 'Próxima cita', type: 'followUp' },
        ],
      },
    },
    {
      id: 'tpl-psychology',
      discipline: Discipline.PSYCHOLOGY,
      name: 'Nota de Psicología',
      description: 'Incluye análisis de formularios y plan terapéutico.',
      schema: {
        sections: [
          { key: 'presenting', title: 'Motivo de consulta', type: 'textarea' },
          { key: 'formAnalysis', title: 'Análisis de formularios', type: 'textarea' },
          { key: 'observations', title: 'Observaciones', type: 'textarea' },
          { key: 'plan', title: 'Plan terapéutico', type: 'textarea' },
          { key: 'followUp', title: 'Próxima cita', type: 'followUp' },
        ],
      },
    },
  ];

  for (const t of templates) {
    await prisma.noteTemplate.upsert({
      where: { id: t.id },
      update: { name: t.name, description: t.description, schema: t.schema, isSystem: true },
      create: {
        id: t.id,
        discipline: t.discipline,
        name: t.name,
        description: t.description,
        schema: t.schema,
        isSystem: true,
      },
    });
  }
  console.log(`  Plantillas -> ${templates.length} plantillas de notas creadas.`);
}

/// Servicios de ejemplo + disponibilidad semanal de la doctora (lun-vie 9-17).
async function seedScheduling(doctoraId: string) {
  const services = [
    { id: 'svc-quiro-consulta', name: 'Consulta de Quiropráctica', description: 'Evaluación y ajuste.', durationMin: 30, priceCents: 6000, discipline: Discipline.CHIROPRACTIC },
    { id: 'svc-evaluacion-inicial', name: 'Evaluación inicial', description: 'Primera visita, historia completa.', durationMin: 60, priceCents: 9000, discipline: null },
    { id: 'svc-telemedicina', name: 'Telemedicina de seguimiento', description: 'Consulta por video.', durationMin: 20, priceCents: 4000, discipline: null },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { name: s.name, description: s.description, durationMin: s.durationMin, priceCents: s.priceCents },
      create: s,
    });
  }

  // Disponibilidad: lunes(1) a viernes(5), 9:00 (540) a 17:00 (1020).
  const existing = await prisma.providerAvailability.count({ where: { providerId: doctoraId } });
  if (existing === 0) {
    for (let day = 1; day <= 5; day++) {
      await prisma.providerAvailability.create({
        data: { providerId: doctoraId, dayOfWeek: day, startMinute: 540, endMinute: 1020 },
      });
    }
  }
  console.log(`  Agenda -> ${services.length} servicios y disponibilidad L-V de la doctora.`);
}

/// Catálogo de pruebas de laboratorio comunes (para el checklist de órdenes).
async function seedLabTests() {
  const tests = [
    { code: 'CBC', name: 'Hemograma completo (CBC)', category: 'Hematología' },
    { code: 'CMP', name: 'Panel metabólico completo (CMP)', category: 'Química' },
    { code: 'BMP', name: 'Panel metabólico básico (BMP)', category: 'Química' },
    { code: 'LIPID', name: 'Perfil de lípidos', category: 'Química' },
    { code: 'HBA1C', name: 'Hemoglobina glicosilada (HbA1c)', category: 'Química' },
    { code: 'GLU', name: 'Glucosa en ayunas', category: 'Química' },
    { code: 'TSH', name: 'Hormona estimulante de tiroides (TSH)', category: 'Endocrino' },
    { code: 'T4', name: 'Tiroxina libre (T4 libre)', category: 'Endocrino' },
    { code: 'VITD', name: 'Vitamina D (25-OH)', category: 'Vitaminas' },
    { code: 'B12', name: 'Vitamina B12', category: 'Vitaminas' },
    { code: 'FE', name: 'Hierro y ferritina', category: 'Hematología' },
    { code: 'UA', name: 'Análisis de orina (Urinálisis)', category: 'Orina' },
    { code: 'PSA', name: 'Antígeno prostático (PSA)', category: 'Oncología' },
    { code: 'HCG', name: 'Prueba de embarazo (hCG)', category: 'Endocrino' },
    { code: 'CRP', name: 'Proteína C reactiva (PCR)', category: 'Inflamación' },
  ];
  const count = await prisma.labTest.count();
  if (count === 0) {
    await prisma.labTest.createMany({ data: tests });
  }
  console.log(`  Labs -> catálogo con ${tests.length} pruebas de laboratorio.`);
}

/// Documentos de consentimiento (texto REPRESENTATIVO — el definitivo lo provee
/// el asesor legal/HIPAA). Una versión activa por tipo, con id fijo.
async function seedConsentDocuments() {
  const docs = [
    {
      id: 'doc-electronic-record',
      type: 'ELECTRONIC_RECORD_USE' as const,
      title: 'Consentimiento para el uso del récord médico electrónico',
      body: 'Autorizo el uso de un récord médico electrónico para almacenar y gestionar mi información de salud. Entiendo que mi información se maneja con controles de seguridad y que puedo solicitar acceso a mis datos. (Texto representativo; el definitivo lo provee su asesor legal.)',
    },
    {
      id: 'doc-hipaa',
      type: 'HIPAA' as const,
      title: 'Aviso de privacidad (HIPAA)',
      body: 'He recibido y comprendo el Aviso de Prácticas de Privacidad conforme a HIPAA, que describe cómo se puede usar y divulgar mi información de salud protegida y mis derechos sobre ella. (Texto representativo.)',
    },
    {
      id: 'doc-rights',
      type: 'PATIENT_RIGHTS_RESPONSIBILITIES' as const,
      title: 'Carta de derechos y responsabilidades del paciente',
      body: 'He leído la carta de derechos y responsabilidades del paciente, que incluye mi derecho a un trato digno, a la confidencialidad, a recibir información sobre mi cuidado, y mis responsabilidades como paciente. (Texto representativo.)',
    },
    {
      id: 'doc-cybersecurity',
      type: 'CYBERSECURITY' as const,
      title: 'Consentimiento de ciberseguridad y comunicación electrónica',
      body: 'Entiendo los riesgos y medidas de seguridad asociados a la comunicación electrónica (portal, mensajes, telemedicina) y consiento su uso para mi atención. (Texto representativo.)',
    },
    {
      id: 'doc-controlled-substances',
      type: 'ADDITIONAL' as const,
      title: 'Consentimiento para tratamiento con sustancias controladas',
      body: 'Consiento el tratamiento con medicamentos controlados y entiendo los riesgos, beneficios, y mi responsabilidad en su uso seguro y de seguimiento. (Texto representativo; se asigna automáticamente según la evaluación inicial.)',
    },
  ];
  for (const d of docs) {
    await prisma.consentDocument.upsert({
      where: { id: d.id },
      update: { title: d.title, body: d.body, isActive: true },
      create: { id: d.id, type: d.type, version: 'v1', title: d.title, body: d.body },
    });
  }
  console.log(`  Consentimientos -> ${docs.length} documentos estándar.`);
}

/// Planes médicos aceptados (ejemplos comunes; se editan desde el dashboard).
async function seedInsurancePlans() {
  const count = await prisma.insurancePlan.count();
  if (count === 0) {
    const plans = ['MCS', 'Triple-S', 'MMM', 'First Medical', 'Humana', 'Plan de Salud Menonita', 'Medicare', 'Medicaid', 'Privado / Pago directo'];
    await prisma.insurancePlan.createMany({ data: plans.map((name) => ({ name })) });
  }
  console.log('  Planes médicos -> catálogo de planes aceptados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
