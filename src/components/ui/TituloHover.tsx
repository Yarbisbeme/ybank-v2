
const TituloHover = ({ title,  }: { title: string }) => {
  return (
            <h1
          className="
            group relative block
            text-5xl sm:text-7xl md:text-8xl
            font-medium tracking-[-0.03em]
            leading-[0.95]
            text-neutral-950
            whitespace-pre-line
            pb-2
          "
        >
            {title}

          <span
            className="
              pointer-events-none
              absolute inset-0 block
              text-[#0179FE]
              leading-[0.95]
              whitespace-pre-line

              mask-[linear-gradient(to_right,#000_0%,#000_100%)]
              mask-size-[0%_100%]
              mask-no-repeat

              transition-[mask-size]
              duration-700 ease-out
              group-hover:mask-size-[100%_100%]
            "
            aria-hidden
          >
            {title}
          </span>
        </h1>
    );
};

export default TituloHover;