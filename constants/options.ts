// constants/options.ts
import { COUNTRIES_CITIES } from './countries';
import { MARITAL_STATUS as MS } from './constants';

export const COUNTRIES = Object.keys(COUNTRIES_CITIES);

// نستخدم مصفوفة موحدة بدلاً من تكرار ذكر الجنسين هنا لتبسيط القوائم المنسدلة
export const MARITAL_STATUS_OPTIONS = MS.male; 

export const YES_NO_OPTIONS = ['نعم', 'لا'];

export const CURRENCY_SYMBOL = 'نقطة';

export const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' }
];

export const APP_THEMES = {
  GENERAL: 'standard-theme',
  MEDIATOR: 'premium-gold-theme' // ثيم خاص لواجهة الوسطاء
};