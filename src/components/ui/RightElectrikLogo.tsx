type Props = { className?: string; width?: number; height?: number };

export function RightElectrikLogo({ className = "", width = 180, height = 75 }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="Right Electrik"
      width={width}
      height={height}
      className={className}
    />
  );
}
