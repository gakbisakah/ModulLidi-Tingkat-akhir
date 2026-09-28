'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#eeeeee] border-t-2 border-[#002BA3] mt-auto">
      {/* Decorative Pattern Top Border */}
      <div className="w-full h-8 overflow-hidden relative">
        <div 
          className="absolute inset-0 w-full h-full opacity-100"
          style={{
            backgroundImage: "url('/img/hero1.png')",
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            backgroundPosition: "center"
          }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Logo Section */}
          <div className="md:col-span-3 flex items-start gap-4">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
               <img 
                src="/NewTitle.png" 
                alt="Logo" 
                width={60} 
                height={60}
                className="object-contain"
               />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-3xl leading-none text-[#002BA3]">Modul</span>
              <span className="font-bold text-3xl leading-none text-[#002BA3]">Lidi</span>
            </div>
          </div>

          {/* Description Section */}
          <div className="md:col-span-6">
            <h3 className="text-[#002BA3] font-bold text-xl mb-4">Tentang Modul Lidi</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Modul Lidi, bagian dari platform DiTenun, membantu penenun menghasilkan ratusan motif beragam hanya dengan menggunakan 8 jenis lidi. Motif-motif ini telah teruji dan dapat diterapkan secara akurat pada kain tenun ulos, memudahkan penenun menciptakan desain yang kaya dan bervariasi.
            </p>
          </div>

          {/* Links Section */}
          <div className="md:col-span-3">
            <h3 className="text-[#002BA3] font-bold text-xl mb-4">Links</h3>
            <div className="grid grid-cols-1 gap-2">
              <a href="http://localhost:8000/" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">Beranda</a>
              <a href="http://localhost:8000/generator/" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">Generator</a>
              <a href="http://localhost:8000/list1/" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">Motif</a>
              <a href="http://localhost:8000/help/" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">Bantuan</a>
              <a href="http://ulospedia.ditenun.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">Ulospedia</a>
              <a href="http://webapp.ditenun.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#002BA3] text-sm transition-colors">WebApp</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
