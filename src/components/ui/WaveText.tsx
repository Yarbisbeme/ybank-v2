"use client";

interface WaveTextProps {
  children: React.ReactNode;
}

export function WaveText({ children }: WaveTextProps) {
  return (
    <span
      className="
        relative inline-block cursor-pointer
        text-neutral-950
        transition-colors duration-300

        bg-size-[200%_200%]
        bg-position-[0%_100%]
        bg-no-repeat

        hover:text-transparent
        hover:bg-position-[0%_0%]

        bg-clip-text
        [-webkit-background-clip:text]

        bg-[linear-gradient(
          180deg,
          #0179FE 0%,
          #0179FE 45%,
          #014ba0 55%,
          transparent 65%
        )]

        transition-[background-position,color]
        duration-700
        ease-out
      "
    >
      {children}
    </span>
  );
}
