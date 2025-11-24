export default function OreIcon({
  oreName,
  scale = 4,
}: {
  oreName: string;
  scale?: number;
}) {
  return (
    /*eslint-disable*/
    <img
      src={`/icons/${oreName}.png`}
      width={16 * scale}
      height={16 * scale}
      alt={oreName}
    />
  );
}
