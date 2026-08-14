-- CreateTable
CREATE TABLE "VitalsRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bpRightArm" JSONB,
    "bpLeftArm" JSONB,
    "bpRightAvgSystolic" INTEGER,
    "bpRightAvgDiastolic" INTEGER,
    "bpLeftAvgSystolic" INTEGER,
    "bpLeftAvgDiastolic" INTEGER,
    "pulseReadings" JSONB,
    "pulseAvg" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bmiCategory" TEXT,
    "bmiPercentile" DOUBLE PRECISION,
    "bmiZScore" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "temperatureC" DOUBLE PRECISION,
    "fitProfile" TEXT,
    "hasPanicValue" BOOLEAN NOT NULL DEFAULT false,
    "panicFlags" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VitalsRecord_patientId_recordedAt_idx" ON "VitalsRecord"("patientId", "recordedAt");

-- AddForeignKey
ALTER TABLE "VitalsRecord" ADD CONSTRAINT "VitalsRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
