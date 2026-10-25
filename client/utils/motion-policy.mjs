// Shared decision boundary for decorative motion. Content never depends on this.
export function motionPolicy({
  desktop,
  reduced,
  fine,
  hidden,
  webgl,
  simple,
  slow,
  cores = 4,
  memory = 4,
  saveData,
}) {
  const limited = simple || slow || cores < 4 || memory < 4 || saveData;
  return {
    desktop: !!desktop && !reduced && !simple,
    fine: !!fine && !reduced && !simple,
    hidden: !!hidden,
    gpu: !!webgl && !limited && !reduced && !hidden,
  };
}
