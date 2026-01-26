import Image from 'next/image';
import React from 'react';

export default function DashboardPage() {
  return (
    // 1. overflow-hidden: Corta cualquier cosa que intente salirse de la pantalla
    // 2. px-4: Margen interno para que no pegue a los bordes
    <div className='h-full w-full flex flex-col items-center justify-center bg-white overflow-hidden px-4'>
        
        {/* Contenedor flexible: Columna en móvil, Fila en PC */}
        <div className="flex flex-col lg:flex-row items-center justify-center">
            
            {/* LOGO:
                - En móvil: w-20 (80px)
                - En PC: w-28 (112px) - restauramos su tamaño original
             */}
            <div className="relative w-24 h-24 lg:w-28 lg:h-28 shrink-0">
                <Image 
                    src="/icons/logoY.svg" 
                    fill
                    className="object-contain"
                    alt="Ybank" 
                />
            </div>

            {/* TEXTO BANK:
                - En móvil: text-6xl (más pequeño para que quepa)
                - En PC: text-9xl (Gigante como querías)
                - leading-none: Para evitar espacios extra arriba/abajo
             */}
            <h1 className='text-6xl lg:text-9xl font-bold text-black/90 mt-2 lg:mt-0 lg:-ml-4 leading-none tracking-tighter'>
                Bank
            </h1>
        </div>

        {/* TEXTO SECUNDARIO:
            - text-center: Para que se vea bien centrado en el móvil
         */}
        <p className='mt-6 text-lg lg:text-2xl text-neutral-600 flex flex-col sm:flex-row items-center gap-1 text-center'>
            <span>Dashboard en construcción</span>
            <span className="flex">
                <span className="text-3xl lg:text-lg animate-[pulse_1.5s_ease-in-out_infinite]">.</span>
                <span className="text-3xl lg:text-lg animate-[pulse_1.5s_ease-in-out_infinite_300ms]">.</span>
                <span className="text-3xl lg:text-lg animate-[pulse_1.5s_ease-in-out_infinite_600ms]">.</span>
            </span>
        </p>
    </div>
  );
}