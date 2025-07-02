
import { useEffect, useState } from "react";

interface ScrollingTextProps {
  text?: string;
}

const ScrollingText = ({ text = "🎉 Selamat datang di GetLife! Platform terpercaya untuk semua kebutuhan jasa rumah tangga Anda. Dapatkan layanan terbaik dari mitra profesional yang telah terverifikasi. Nikmati kemudahan dan kenyamanan dalam satu aplikasi! 🏠✨" }: ScrollingTextProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-xl shadow-lg mx-6 mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20"></div>
      <div className="relative px-4 py-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">📢</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-white font-medium text-sm">
                {text}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
};

export default ScrollingText;
