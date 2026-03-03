import { LevelBadge } from './badges'; // المكون الفخم الذي صممناه أولاً
import { getAutoBadgeType } from '../constants/constants'; // دالة المنطق

interface AutoBadgeProps {
  value: number;      // عدد النقاط أو عدد العملاء
  isBroker: boolean;  // هل هو وسيط أم مستخدم عادي؟
  size?: string;      // حجم الخط
}

export const AutoBadge = ({ value, isBroker, size = "text-base" }: AutoBadgeProps) => {
  const badgeType = getAutoBadgeType(value, isBroker);

  if (!badgeType) return null;

  return <LevelBadge type={badgeType} size={size} />;
};