import React from 'react';
import { Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';
import { MONTHS_AR } from '../data/initialData';

interface MonthSplashModalProps {
  currentMonth: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectMonth: (month: number) => void;
}

export const MonthSplashModal: React.FC<MonthSplashModalProps> = ({
  currentMonth,
  isOpen,
  onClose,
  onSelectMonth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Calendar className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-800 mb-1">تطبيق المشرف التربوي</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">ARRAHAL LAHCEN — مشروع INDH شيشاوة</p>

        <p className="text-sm font-semibold text-blue-900 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
          اختر الشهر للبدء أو لمتابعة البيانات:
        </p>

        <div className="grid grid-cols-3 gap-2.5 w-full max-h-[50vh] overflow-y-auto p-1 mb-6">
          {Object.entries(MONTHS_AR).map(([mNum, name]) => {
            const m = parseInt(mNum, 10);
            const isSelected = currentMonth === m;
            return (
              <button
                key={m}
                onClick={() => onSelectMonth(m)}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-200 border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <span>{name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>دخول التطبيق</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
