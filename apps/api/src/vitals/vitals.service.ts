import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Sex } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CdcService, BiologicalSex, CdcMeasure } from '../clinical/cdc.service';
import { CreateVitalsDto, BpReadingDto } from './dto/create-vitals.dto';
import { calcBmi, adultBmiCategory, ageInMonths } from '../clinical/bmi.util';
import { detectPanicValues, average } from '../clinical/panic.util';
import { normalizeWeightToKg, normalizeHeightToCm, normalizeTempToC } from '../clinical/units.util';

@Injectable()
export class VitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cdc: CdcService,
  ) {}

  /// Registra una toma de vitales y calcula BMI, promedios, percentiles y alertas.
  async create(patientId: string, dto: CreateVitalsDto, recordedById?: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');

    // --- Promedios de presión por brazo ---
    const rAvg = this.bpAverage(dto.bpRightArm);
    const lAvg = this.bpAverage(dto.bpLeftArm);
    const pulseAvg = dto.pulse ? average(dto.pulse) : null;

    // --- Antropometría en unidades canónicas ---
    const weightKg =
      dto.weightValue != null
        ? normalizeWeightToKg(dto.weightValue, dto.weightUnit ?? 'kg')
        : null;
    const heightCm =
      dto.heightUnit != null
        ? normalizeHeightToCm({
            unit: dto.heightUnit,
            value: dto.heightValue,
            feet: dto.heightFeet,
            inches: dto.heightInches,
          })
        : null;
    const temperatureC =
      dto.temperatureValue != null
        ? normalizeTempToC(dto.temperatureValue, dto.temperatureUnit ?? 'C')
        : null;

    // --- BMI + clasificación / percentil ---
    const bmi = calcBmi(weightKg, heightCm);
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    const months = ageInMonths(patient.dateOfBirth, recordedAt);
    const sex = this.toBiologicalSex(patient.sex);
    const isPediatric = sex != null && this.cdc.isPediatricAge(months);

    let bmiCategory: string | null = null;
    let bmiPercentile: number | null = null;
    let bmiZScore: number | null = null;

    if (bmi != null) {
      if (isPediatric && sex) {
        const r = this.cdc.percentileFor('bmiForAge', sex, months, bmi);
        if (r) {
          bmiPercentile = r.percentile;
          bmiZScore = r.zScore;
          bmiCategory = this.pediatricBmiCategory(r.percentile);
        }
      } else {
        bmiCategory = adultBmiCategory(bmi);
      }
    }

    // --- Alertas de valores pánico ---
    const bpMaxSystolic = this.maxOrNull(rAvg?.systolic, lAvg?.systolic);
    const bpMaxDiastolic = this.maxOrNull(rAvg?.diastolic, lAvg?.diastolic);
    const panicFlags = detectPanicValues({
      bpMaxSystolic,
      bpMaxDiastolic,
      temperatureC,
      oxygenSaturation: dto.oxygenSaturation ?? null,
      bmi,
      isPediatric,
      bmiPercentile,
    });

    return this.prisma.vitalsRecord.create({
      data: {
        patientId,
        recordedById,
        recordedAt,
        bpRightArm: (dto.bpRightArm as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        bpLeftArm: (dto.bpLeftArm as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        bpRightAvgSystolic: rAvg?.systolic ?? null,
        bpRightAvgDiastolic: rAvg?.diastolic ?? null,
        bpLeftAvgSystolic: lAvg?.systolic ?? null,
        bpLeftAvgDiastolic: lAvg?.diastolic ?? null,
        pulseReadings: (dto.pulse as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        pulseAvg,
        weightKg,
        heightCm,
        bmi,
        bmiCategory,
        bmiPercentile,
        bmiZScore,
        oxygenSaturation: dto.oxygenSaturation ?? null,
        temperatureC,
        fitProfile: dto.fitProfile ?? null,
        hasPanicValue: panicFlags.length > 0,
        panicFlags: panicFlags.length
          ? (panicFlags as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        notes: dto.notes ?? null,
      },
    });
  }

  /// Lista las tomas de vitales de un paciente (más recientes primero).
  async listByPatient(patientId: string) {
    return this.prisma.vitalsRecord.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /// Datos para graficar el crecimiento: curvas de referencia del CDC + los
  /// puntos del propio paciente con su percentil.
  async growthChart(patientId: string, measure: CdcMeasure) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { vitals: { orderBy: { recordedAt: 'asc' } } },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');

    const sex = this.toBiologicalSex(patient.sex);
    if (!sex) {
      return { applicable: false, reason: 'El sexo del paciente no permite usar las curvas del CDC.' };
    }

    const reference = this.cdc.referenceCurves(measure, sex);

    // Puntos del paciente según la medida solicitada.
    const points = patient.vitals
      .map((v) => {
        const ageMonths = ageInMonths(patient.dateOfBirth, v.recordedAt);
        let value: number | null = null;
        if (measure === 'bmiForAge') value = v.bmi;
        else if (measure === 'weightForAge') value = v.weightKg;
        else if (measure === 'statureForAge') value = v.heightCm;
        if (value == null) return null;
        const r = this.cdc.percentileFor(measure, sex, ageMonths, value);
        return { ageMonths, value, percentile: r?.percentile ?? null, recordedAt: v.recordedAt };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return { applicable: true, measure, sex, reference, points };
  }

  // ------------------------------------------------------------------ helpers

  private bpAverage(readings?: BpReadingDto[]) {
    if (!readings || readings.length === 0) return null;
    const systolic = average(readings.map((r) => r.systolic));
    const diastolic = average(readings.map((r) => r.diastolic));
    if (systolic == null || diastolic == null) return null;
    return { systolic, diastolic };
  }

  private maxOrNull(a?: number | null, b?: number | null): number | null {
    const vals = [a, b].filter((n): n is number => typeof n === 'number');
    return vals.length ? Math.max(...vals) : null;
  }

  private toBiologicalSex(sex: Sex): BiologicalSex | null {
    if (sex === 'MALE') return 'MALE';
    if (sex === 'FEMALE') return 'FEMALE';
    return null; // INTERSEX / UNKNOWN: no aplican las curvas binarias del CDC
  }

  /// Clasificación de BMI pediátrico por percentil (CDC).
  private pediatricBmiCategory(percentile: number): string {
    if (percentile < 5) return 'Bajo peso';
    if (percentile < 85) return 'Normal';
    if (percentile < 95) return 'Sobrepeso';
    return 'Obesidad';
  }
}
