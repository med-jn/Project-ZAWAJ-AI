'use client';

export const GoogleButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="btn-premium w-full flex items-center justify-center gap-3 bg-white !text-black hover:bg-gray-100 shadow-xl"
  >
    <img
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt="Google"
      className="w-5 h-5"
    />
    <span className="font-bold">الدخول عبر جوجل</span>
  </button>
);
