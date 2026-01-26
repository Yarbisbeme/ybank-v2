import Image from 'next/image';
import React from 'react';

export default function DashboardPage() {
  return (
    <div className='h-full w-full flex flex-col items-center justify-center '>
        <div className="flex row items-center">
            <Image  src="/icons/logoY.svg" width={112} height={112} alt="Ybank" />
            <h1 className='text-8xl font-bold text-black/90 -ml-4'>Bank</h1>
        </div>
        <p className='mt-4 text-2xl text-neutral-600 flex items-center gap-1'>
            Dashboard en construcción
            {/* Contenedor de los puntos animados */}
            <span className="flex">
                <span className="animate-[pulse_1.5s_ease-in-out_infinite]">.</span>
                <span className="animate-[pulse_1.5s_ease-in-out_infinite_300ms]">.</span>
                <span className="animate-[pulse_1.5s_ease-in-out_infinite_600ms]">.</span>
            </span>
        </p>
    </div>
  );
}