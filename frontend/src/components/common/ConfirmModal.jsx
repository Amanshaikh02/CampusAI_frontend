import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  itemName,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isLoading = false,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-center text-center">
          {/* SweetAlert Warning Icon */}
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 ring-8 ring-red-50/50">
            <AlertTriangle size={28} />
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="mt-3 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 max-w-full truncate">
              {itemName}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
