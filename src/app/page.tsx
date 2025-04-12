"use client";

import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/images/GrayolaLogo.png"
        alt="Grayola Logo"
        width={200}
        height={100}
        className="mb-8"
      />
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Grayola Task Manager
      </h1>
      <button
        onClick={() => window.location.href = '/login'}
        className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 px-6 rounded-full text-xl"
      >
        Ingresar
      </button>
    </main>
  );
}
