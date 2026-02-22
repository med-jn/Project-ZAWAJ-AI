const handleVerifyPin = () => {
    // جلب الرمز من ملف البيئة، وإذا لم يوجد نستخدم '1234' كافتراضي
    const CORRECT_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN_CODE || '1234';
    
    if (pin === CORRECT_PIN) { 
       setShowPinModal(false); // إغلاق النافذة أولاً
       router.push('/admin');
    } else {
      alert('الرمز غير صحيح! جرب 1234 إذا لم تغيره في ملف env');
      setPin(''); // مسح الخانة للمحاولة مرة أخرى
    }
  };