/**
 * Calibration Formula Engine
 * 
 * Supports multiple formula types per sensor measurement:
 * - linear: y = mx + b
 * - offset: y = x - offset
 * - water_level: y = x - (pipe_length - remaining_pipe)
 * - polynomial: y = a*x² + b*x + c
 * - lookup_table: use interpolation table
 */

export type FormulaType = 
  | "linear"           // y = slope * x + intercept
  | "offset"           // y = x - offset
  | "water_level"      // y = x - (pipe_length - remaining_pipe)
  | "polynomial"       // y = a*x² + b*x + c
  | "lookup_table"     // interpolated from table
  | "none";            // no calibration, y = x

export interface LinearFormula {
  type: "linear";
  slope: number;
  intercept: number;
}

export interface OffsetFormula {
  type: "offset";
  offset: number;
}

export interface WaterLevelFormula {
  type: "water_level";
  // Parameters are stored in device.calibrationParams, not here
  // pipe_length: number;
  // remaining_pipe: number;
}

export interface PolynomialFormula {
  type: "polynomial";
  coefficients: number[]; // [c, b, a] for c + bx + ax²
}

export interface LookupTableFormula {
  type: "lookup_table";
  table: Array<{ raw: number; calibrated: number }>;
}

export interface NoFormula {
  type: "none";
}

export type CalibrationFormula =
  | LinearFormula
  | OffsetFormula
  | WaterLevelFormula
  | PolynomialFormula
  | LookupTableFormula
  | NoFormula;

// Calibration formulas configuration per device
export interface DeviceCalibrationFormulas {
  waterLevel?: CalibrationFormula;
  rainMeter?: CalibrationFormula;
  soilMoisture?: CalibrationFormula;
  soilTemperature?: CalibrationFormula;
  soilConductivity?: CalibrationFormula;
  phValue?: CalibrationFormula;
}

// Calibration parameters (variables used in formulas)
export interface DeviceCalibrationParams {
  pipe_length?: number;      // cm - for water_level formula
  remaining_pipe?: number;   // cm - for water_level formula
  sensor_depth?: number;     // cm - soil sensor installation depth
  [key: string]: number | undefined;
}

// Default formulas for each measurement
export const DEFAULT_FORMULAS: DeviceCalibrationFormulas = {
  waterLevel: { type: "water_level" },
  rainMeter: { type: "none" },
  soilMoisture: { type: "none" },
  soilTemperature: { type: "none" },
  soilConductivity: { type: "none" },
  phValue: { type: "none" },
};

/**
 * Apply calibration formula to a raw value
 */
export function applyCalibration(
  rawValue: number,
  formula: CalibrationFormula | undefined,
  params: DeviceCalibrationParams = {}
): number {
  if (rawValue === null || rawValue === undefined) {
    return rawValue;
  }

  if (!formula) {
    return rawValue;
  }

  switch (formula.type) {
    case "none":
      return rawValue;

    case "linear":
      return formula.slope * rawValue + formula.intercept;

    case "offset":
      return rawValue - formula.offset;

    case "water_level": {
      // Formula: water_level = raw - (pipe_length - remaining_pipe)
      const pipeLength = params.pipe_length ?? 0;
      const remainingPipe = params.remaining_pipe ?? 0;
      const offset = pipeLength - remainingPipe;
      return rawValue - offset;
    }

    case "polynomial": {
      let result = 0;
      formula.coefficients.forEach((coef, index) => {
        result += coef * Math.pow(rawValue, index);
      });
      return result;
    }

    case "lookup_table": {
      const table = formula.table.sort((a, b) => a.raw - b.raw);
      
      // Find surrounding points
      const lower = table.findLast((p) => p.raw <= rawValue);
      const upper = table.find((p) => p.raw >= rawValue);
      
      if (!lower && !upper) return rawValue;
      if (!lower) return upper!.calibrated;
      if (!upper) return lower.calibrated;
      if (lower.raw === upper.raw) return lower.calibrated;
      
      // Linear interpolation
      const ratio = (rawValue - lower.raw) / (upper.raw - lower.raw);
      return lower.calibrated + ratio * (upper.calibrated - lower.calibrated);
    }

    default:
      return rawValue;
  }
}

/**
 * Apply all calibrations to a readings object
 */
export interface RawReadings {
  rawWaterLevel?: number | null;
  rawRainMeter?: number | null;
  rawSoilMoisture?: number | null;
  rawSoilTemperature?: number | null;
  rawSoilConductivity?: number | null;
  rawPhValue?: number | null;
}

export interface CalibratedReadings {
  waterLevel?: number | null;
  rainMeter?: number | null;
  soilMoisture?: number | null;
  soilTemperature?: number | null;
  soilConductivity?: number | null;
  phValue?: number | null;
}

export function calibrateAllReadings(
  raw: RawReadings,
  formulas: DeviceCalibrationFormulas,
  params: DeviceCalibrationParams
): CalibratedReadings {
  return {
    waterLevel: applyCalibration(raw.rawWaterLevel ?? 0, formulas.waterLevel, params),
    rainMeter: applyCalibration(raw.rawRainMeter ?? 0, formulas.rainMeter, params),
    soilMoisture: applyCalibration(raw.rawSoilMoisture ?? 0, formulas.soilMoisture, params),
    soilTemperature: applyCalibration(raw.rawSoilTemperature ?? 0, formulas.soilTemperature, params),
    soilConductivity: applyCalibration(raw.rawSoilConductivity ?? 0, formulas.soilConductivity, params),
    phValue: applyCalibration(raw.rawPhValue ?? 0, formulas.phValue, params),
  };
}

/**
 * Validate calibration formulas
 */
export function validateFormula(formula: CalibrationFormula): string | null {
  switch (formula.type) {
    case "linear":
      if (typeof formula.slope !== "number") {
        return "Linear formula requires 'slope' number";
      }
      if (typeof formula.intercept !== "number") {
        return "Linear formula requires 'intercept' number";
      }
      return null;

    case "offset":
      if (typeof formula.offset !== "number") {
        return "Offset formula requires 'offset' number";
      }
      return null;

    case "water_level":
      // No parameters needed in formula itself - comes from params
      return null;

    case "polynomial":
      if (!Array.isArray(formula.coefficients)) {
        return "Polynomial formula requires 'coefficients' array";
      }
      return null;

    case "lookup_table":
      if (!Array.isArray(formula.table) || formula.table.length < 2) {
        return "Lookup table formula requires at least 2 points";
      }
      return null;

    case "none":
      return null;

    default:
      return `Unknown formula type: ${(formula as any).type}`;
  }
}

/**
 * Validate calibration parameters
 */
export function validateParams(
  formulas: DeviceCalibrationFormulas,
  params: DeviceCalibrationParams
): string | null {
  if (formulas.waterLevel?.type === "water_level") {
    if (params.pipe_length === undefined) {
      return "Water level calibration requires 'pipe_length' parameter (cm)";
    }
    if (params.remaining_pipe === undefined) {
      return "Water level calibration requires 'remaining_pipe' parameter (cm)";
    }
    if (params.pipe_length < 0 || params.remaining_pipe < 0) {
      return "Pipe lengths must be non-negative";
    }
    if (params.remaining_pipe > params.pipe_length) {
      return "Remaining pipe cannot exceed pipe length";
    }
  }
  return null;
}

/**
 * Example usage for water level:
 * 
 * Device calibrationFormulas:
 * {
 *   "waterLevel": { "type": "water_level" },
 *   "soilMoisture": { "type": "linear", "slope": 1.05, "intercept": -2.5 }
 * }
 * 
 * Device calibrationParams:
 * {
 *   "pipe_length": 500,      // 500 cm total pipe
 *   "remaining_pipe": 100    // 100 cm above water
 * }
 * 
 * Raw reading: waterLevel = 450 cm (sensor reading)
 * Calibrated: 450 - (500 - 100) = 450 - 400 = 50 cm actual water level
 */
