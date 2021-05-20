/**
 * Calculates active power using simpsons rule approximation
 * @param {[]} voltageSamples set of instantaneous voltages
 * @param {[]} currentSamples set of instantaneous currents
 * @param {Number} timeStep time between two samples in seconds
 * @returns active power
 */
const calculatePower = (voltageSamples = [], currentSamples = [], timeStep = 0.001) => {
  let power = 0;

  // sample size of voltage and current may not be equal
  let sampleSize = Math.min(voltageSamples.length, currentSamples.length);

  if (sampleSize % 2 === 0) {
    sampleSize -= 1;
  }

  for (let i = 0; i < sampleSize - 2; i += 2) {
    const f0 = voltageSamples[i] * currentSamples[i];
    const f1 = voltageSamples[i + 1] * currentSamples[i + 1];
    const f2 = voltageSamples[i + 2] * currentSamples[i + 2];

    power += f0 + 4 * f1 + f2;
  }

  power *= timeStep / 3;
  return (1 / (timeStep * (sampleSize - 1))) * power;
};

module.exports = calculatePower;
