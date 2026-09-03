import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  TrendingDown,
  ShoppingCart,
  Calendar,
  Sparkles,
  ChefHat,
  Shield,
  Bell,
  ArrowRight,
  CheckCircle2,
  Circle,
  Trash2,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'expiry':
      return { icon: Clock, color: 'text-red-600 bg-red-50 border-red-200' };
    case 'low_stock':
      return { icon: TrendingDown, color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'shopping':
      return { icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    case 'meal_plan':
      return { icon: Calendar, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    case 'ai_recommendation':
      return { icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    case 'cooking':
      return { icon: ChefHat, color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.12)] border-[rgba(138,144,112,0.25)]' };
    case 'account':
      return { icon: Shield, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    default:
      return { icon: Bell, color: 'text-[var(--color-sage)] bg-[var(--color-parchment)] border-[rgba(138,144,112,0.2)]' };
  }
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = Math.max(0, now - new Date(timestamp).getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const NotificationCard = ({
  notification,
  onToggleRead,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { icon: Icon, color } = getCategoryIcon(notification.category);
  const timeStr = formatRelativeTime(notification.timestamp);
  const isRead = notification.isRead;

  const priorityVariant =
    notification.priority === 'high'
      ? 'danger'
      : notification.priority === 'medium'
      ? 'warning'
      : 'neutral';

  const handleAction = (e) => {
    e.stopPropagation();
    if (!isRead) onToggleRead?.(notification.id);
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      onClick={() => onToggleRead?.(notification.id)}
      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col sm:flex-row items-start justify-between gap-4 group ${
        isRead
          ? 'bg-white border-[rgba(138,144,112,0.14)] opacity-85 hover:opacity-100 hover:border-[var(--color-sage)] shadow-xs'
          : 'bg-white border-[rgba(138,144,112,0.30)] ring-1 ring-[var(--color-sage)]/20 shadow-[0_2px_8px_rgba(39,42,31,0.06)]'
      }`}
    >
      {/* Left: Icon & Body */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Category Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border mt-0.5 shadow-xs ${color}`}>
          <Icon size={18} />
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          {/* Top badges & Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isRead ? 'bg-transparent' : 'bg-emerald-500 animate-pulse'
              }`}
              title={isRead ? 'Read' : 'Unread'}
            />
            <h3
              className={`text-sm sm:text-base font-extrabold leading-snug truncate ${
                isRead ? 'text-[var(--color-dark)]' : 'text-[var(--color-dark)]'
              }`}
            >
              {notification.title}
            </h3>

            {notification.priority && (
              <Badge variant={priorityVariant} size="sm">
                {notification.priority} priority
              </Badge>
            )}

            <span className="text-[11px] font-semibold text-[var(--color-sage)] ml-auto sm:ml-0 flex-shrink-0">
              {timeStr}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[var(--color-sage)] font-medium leading-relaxed">
            {notification.description}
          </p>

          {/* Action Trigger Button */}
          {notification.actionText && (
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleAction}
                className="text-xs font-bold"
              >
                {notification.actionText}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: Mark read / Delete */}
      <div
        className="flex items-center gap-1 self-end sm:self-start opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleRead?.(notification.id)}
          aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
          title={isRead ? 'Mark as unread' : 'Mark as read'}
        >
          {isRead ? <Circle size={15} /> : <CheckCircle2 size={15} className="text-emerald-600" />}
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(notification.id)}
          aria-label="Delete notification"
          className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete notification"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationCard;
