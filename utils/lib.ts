export const calculateUpgradeCost = (level: number) => {
  return Math.floor(50 * Math.pow(1.35, level));
};
