export const Brand = () => (
  <div className="text-center animate-slow-fade">
    <h1 className="  flex-row-reverse text-3xl font-black tracking-tighter flex items-center justify-center gap-2 font-cairo">
      <span className="
        relative px-0
        bg-gold-metallic bg-clip-text text-white 
        text-gold-luxury drop-shadow ">ZAWAJ</span>
      
      {/* كلمة AI الذهبية */}
      <span className="
        relative px-2
        bg-gold-metallic bg-clip-text text-transparent 
        text-gold-luxury
        overflow-hidden
      ">
        AI
        {/* تأثير الشعاع اللامع المتحرك */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-slow-shine pointer-events-none" />
      </span>
    </h1>
    <p className="text-text-secondary mt-2 text-xs font-cairo">
      اختار شريك حياتك بذكاء وأمان
    </p>
  </div>
);