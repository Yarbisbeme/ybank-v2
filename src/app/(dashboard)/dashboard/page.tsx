import Image from 'next/image';
import React from 'react';

export default function DashboardPage() {
  return (
    <div className='h-full w-full flex flex-col items-center justify-center '>
        <div className="flex row items-center">
            <Image  src="/icons/logoY.svg" width={112} height={112} alt="Ybank" />
            <h1 className='text-8xl font-bold -ml-2'>Bank</h1>
        </div>
        <p className='mt-4 text-2xl text-neutral-600'>Dashboard en construcción...</p>
    </div>
  );
}