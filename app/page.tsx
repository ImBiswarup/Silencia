'use client'

import ConfessionForm from "./components/ConfessionForm";
import ConfessionFeed from "./components/ConfessionFeed";
import Header from "./components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <ConfessionForm onPostCreated={function (): void {
          throw new Error("Function not implemented.");
        }} />
        <ConfessionFeed />
      </main>
    </div>
  );
}