/**
 * Calculates active power
 * @param {[]} voltageSamples set of instantaneous voltages
 * @param {[]} currentSamples set of instantaneous currents
 * @param {Number} timeStep time between two samples in seconds
 * @returns active power
 */
const calculatePower = (voltageSamples = [], currentSamples = [], timeStep = 0.001) => {
  let power = 0;
  const sampleSize = Math.min(voltageSamples.length, currentSamples.length);

  for (let i = 1; i < sampleSize; i += 1) {
    const a = voltageSamples[i - 1] * currentSamples[i - 1];
    const b = voltageSamples[i] * currentSamples[i];

    power += (a + b) * timeStep * 0.5;
  }

  return (1 / (timeStep * (voltageSamples.length - 1))) * power;
};

module.exports = calculatePower;
