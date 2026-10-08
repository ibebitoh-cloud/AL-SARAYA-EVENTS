import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Building,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Hall, Language } from '../types/venueSystem';
import { VenuePhoto } from '../data/venueImages';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface HallPhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  halls: Hall[];
  photos: VenuePhoto[];
  language: Language;
  onSaveHalls: (updatedHalls: Hall[]) => void;
  onSavePhotos: (updatedPhotos: VenuePhoto[]) => void;
  onResetDefaults: () => void;
  initialTab?: 'halls' | 'photos';
  targetHallOrPhotoId?: string;
}

export function HallPhotoManagerModal({
  isOpen,
  onClose,
  halls,
  photos,
  language,
  onSaveHalls,
  onSavePhotos,
  onResetDefaults,
  initialTab = 'halls',
  targetHallOrPhotoId,
}: HallPhotoManagerModalProps) {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeTab, setActiveTab] = useState<'halls' | 'photos'>(initialTab);

  // Local working copies of halls and photos
  const [localHalls, setLocalHalls] = useState<Hall[]>(halls);
  const [selectedHallId, setSelectedHallId] = useState<string>(
    targetHallOrPhotoId && halls.some((h) => h.id === targetHallOrPhotoId)
      ? targetHallOrPhotoId
      : halls[0]?.id || 'hall-1'
  );

  const [localPhotos, setLocalPhotos] = useState<VenuePhoto[]>(photos);
  const [photoCategoryFilter, setPhotoCategoryFilter] = useState<'all' | 'wedding' | 'engagement' | 'birthday' | 'corporate'>('all');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(
    targetHallOrPhotoId && photos.some((p) => p.id === targetHallOrPhotoId)
      ? targetHallOrPhotoId
      : photos[0]?.id || 'photo-1'
  );

  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalHalls(halls);
    setLocalPhotos(photos);
    setActiveTab(initialTab);
    setSelectedHallId(targetHallOrPhotoId && halls.some((h) => h.id === targetHallOrPhotoId) ? targetHallOrPhotoId : halls[0]?.id || 'hall-1');
    setSelectedPhotoId(targetHallOrPhotoId && photos.some((p) => p.id === targetHallOrPhotoId) ? targetHallOrPhotoId : photos[0]?.id || '');
    setPhotoCategoryFilter('all');
  }, [isOpen, halls, photos, initialTab, targetHallOrPhotoId]);

  if (!isOpen) return null;

  const selectedHall = localHalls.find((h) => h.id === selectedHallId) || localHalls[0];
  const selectedPhoto = localPhotos.find((p) => p.id === selectedPhotoId) || localPhotos[0];
  const sourceKey = (src: string) => (src || '').trim().replace(/[?#].*$/, '').toLowerCase();
  const sourceCounts = localPhotos.reduce<Record<string, number>>((counts, photo) => {
    const key = sourceKey(photo.src);
    if (key) counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const hasDuplicateSources = Object.values(sourceCounts).some((count) => count > 1);
  const hasEmptySources = localPhotos.some((photo) => !photo.src?.trim());
  const filteredPhotos = localPhotos.filter((photo) => {
    if (photoCategoryFilter === 'all') return true;
    if (photoCategoryFilter === 'wedding') return ['wedding', 'ballroom', 'kosha', 'dining'].includes(photo.category);
    if (photoCategoryFilter === 'birthday') return ['birthday', 'party'].includes(photo.category);
    return photo.category === photoCategoryFilter;
  });

  // Update a single hall field
  const handleUpdateHall = (field: keyof Hall, value: any) => {
    setLocalHalls((prev) =>
      prev.map((h) => (h.id === selectedHallId ? { ...h, [field]: value } : h))
    );
  };

  // Update a single photo field
  const handleUpdatePhoto = (field: keyof VenuePhoto, value: any) => {
    setLocalPhotos((prev) =>
      prev.map((p) => (p.id === selectedPhotoId ? { ...p, [field]: value } : p))
    );
  };

  // Handle uploading local photo file
  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (activeTab === 'photos') {
          handleUpdatePhoto('src', dataUrl);
        } else if (activeTab === 'halls') {
          handleUpdateHall('photo', dataUrl);
          handleUpdateHall('photoUrl', dataUrl);
        }
        sound.pop();
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new hall
  const handleAddNewHall = () => {
    sound.click(750);
    const newId = `hall-${Date.now()}`;
    const newHall: Hall = {
      id: newId,
      name: isAr ? 'قاعة جديدة بالسرايا' : 'New Saraya Hall',
      nameEn: 'New Saraya Hall',
      capacity: 300,
      basePrice: 35000,
      color: '#d4af37',
      areaSqMeters: 600,
      description: isAr ? 'قاعة ملكية جديدة مجهزة بأحدث التقنيات.' : 'Brand new royal venue hall.',
      descriptionEn: 'Brand new royal venue hall with state-of-the-art facilities.',
      photo: photos[0]?.src || '',
    };
    setLocalHalls((prev) => [...prev, newHall]);
    setSelectedHallId(newId);
  };

  // Delete hall
  const handleDeleteHall = (id: string) => {
    if (localHalls.length <= 1) return;
    sound.tick();
    setLocalHalls((prev) => prev.filter((h) => h.id !== id));
    if (selectedHallId === id) {
      const remaining = localHalls.filter((h) => h.id !== id);
      setSelectedHallId(remaining[0]?.id || '');
    }
  };

  // Add new photo
  const handleAddNewPhoto = () => {
    sound.click(750);
    const newId = `photo-${Date.now()}`;
    const newPhoto: VenuePhoto = {
      id: newId,
      src: '',
      titleAr: isAr ? 'صورة جديدة للمعرض' : 'New Gallery Photo',
      titleEn: 'New Gallery Photo',
      hallNameAr: selectedHall?.name || 'القاعة الملكية الكبرى',
      hallNameEn: selectedHall?.nameEn || 'The Royal Grand Ballroom',
      hallId: selectedHall?.id || 'hall-1',
      captionAr: 'لقطة حية توثق أدق تفاصيل المناسبة بالسرايا.',
      captionEn: 'Live photo capturing the fine details of celebrations at Saraya.',
      category: 'wedding',
      parallaxSpeed: 30,
      tags: ['جديد', 'السرايا'],
    };
    setLocalPhotos((prev) => [newPhoto, ...prev]);
    setSelectedPhotoId(newId);
  };

  // Delete photo
  const handleDeletePhoto = (id: string) => {
    if (localPhotos.length <= 1) return;
    sound.tick();
    setLocalPhotos((prev) => prev.filter((p) => p.id !== id));
    if (selectedPhotoId === id) {
      const remaining = localPhotos.filter((p) => p.id !== id);
      setSelectedPhotoId(remaining[0]?.id || '');
    }
  };

  // Save all changes
  const handleSaveAll = () => {
    sound.fanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    onSaveHalls(localHalls);
    onSavePhotos(localPhotos);

    // Save to localStorage
    try {
      localStorage.setItem('alsaraya_custom_halls', JSON.stringify(localHalls));
      localStorage.setItem('alsaraya_custom_photos', JSON.stringify(localPhotos));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1200);
  };

  // Reset
  const handleResetToFactoryDefaults = () => {
    if (confirm(isAr ? 'هل أنت متأكد من استعادة أسماء القاعات والصور الأصلية؟' : 'Reset halls and photos to initial defaults?')) {
      sound.swoosh();
      onResetDefaults();
      try {
        localStorage.removeItem('alsaraya_custom_halls');
        localStorage.removeItem('alsaraya_custom_photos');
      } catch (e) {
        console.warn('Storage clear error:', e);
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.click(600);
            onClose();
          }}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col my-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/15 bg-slate-950/90">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  {isAr ? 'مكتبة صور المناسبات وإدارة القاعات' : 'Event Photo Library & Venue Manager'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'نظّم صور الأفراح والخطوبة وأعياد الميلاد والمؤتمرات، وارفع صوراً جديدة أو اربطها بقاعة.'
                  : 'Organize wedding, engagement, birthday and conference photos; upload new images or assign them to a hall.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.click(600);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.tick();
                  setActiveTab('halls');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'halls'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>{isAr ? 'تعديل القاعات والأسماء' : 'Halls & Spaces Editor'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
                  {localHalls.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.tick();
                  setActiveTab('photos');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'photos'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isAr ? 'تعديل واستبدال صور المعرض' : 'Photo Library Editor'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
                  {localPhotos.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToFactoryDefaults}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
              title={isAr ? 'استعادة الإعدادات الأصلية' : 'Reset to factory defaults'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
            </button>
          </div>

          {/* Hidden File Input for uploading local images */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageFileUpload}
            className="hidden"
          />

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. HALLS EDITOR TAB */}
            {activeTab === 'halls' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Halls Selector List (Left Column) */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1">
                    <span>{isAr ? 'اختر القاعة للتعديل:' : 'Select Hall to Edit:'}</span>
                    <button
                      type="button"
                      onClick={handleAddNewHall}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة قاعة' : 'Add Hall'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pe-1">
                    {localHalls.map((h) => {
                      const isSelected = h.id === selectedHallId;
                      return (
                        <div
                          key={h.id}
                          onClick={() => {
                            sound.tick();
                            setSelectedHallId(h.id);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/15 text-white shadow-md'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{h.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {h.nameEn || h.name} · {h.capacity} {isAr ? 'فرد' : 'Guests'}
                            </div>
                          </div>

                          {localHalls.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHall(h.id);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title={isAr ? 'حذف هذه القاعة' : 'Delete hall'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hall Form Editor (Right Column) */}
                {selectedHall && (
                  <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-amber-300">
                        {isAr ? `تعديل بيانات: ${selectedHall.name}` : `Editing: ${selectedHall.nameEn || selectedHall.name}`}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">{selectedHall.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'اسم القاعة باللغة العربية:' : 'Hall Name (Arabic):'}
                        </label>
                        <input
                          type="text"
                          value={selectedHall.name}
                          onChange={(e) => handleUpdateHall('name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'اسم القاعة باللغة الإنجليزية:' : 'Hall Name (English):'}
                        </label>
                        <input
                          type="text"
                          value={selectedHall.nameEn || ''}
                          onChange={(e) => handleUpdateHall('nameEn', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'السعة القصوى للمدعوين:' : 'Max Guest Capacity:'}
                        </label>
                        <input
                          type="number"
                          value={selectedHall.capacity}
                          onChange={(e) => handleUpdateHall('capacity', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'سعر إيجار القاعة الأساسي (EGP):' : 'Base Rental Price (EGP):'}
                        </label>
                        <input
                          type="number"
                          value={selectedHall.basePrice}
                          onChange={(e) => handleUpdateHall('basePrice', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'المساحة بالمتر المربع (م²):' : 'Area (Sq Meters):'}
                        </label>
                        <input
                          type="number"
                          value={selectedHall.areaSqMeters || 800}
                          onChange={(e) => handleUpdateHall('areaSqMeters', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'رابط صورة القاعة أو رفع ملف:' : 'Photo URL or Upload File:'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedHall.photo || ''}
                            onChange={(e) => {
                              handleUpdateHall('photo', e.target.value);
                              handleUpdateHall('photoUrl', e.target.value);
                            }}
                            placeholder="https://... or data:image"
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 truncate"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1.5 shrink-0"
                            title={isAr ? 'رفع صورة من جهازك' : 'Upload file'}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isAr ? 'رفع' : 'Upload'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1 text-xs">
                        {isAr ? 'الوصف بالعربية:' : 'Description (Arabic):'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedHall.description || ''}
                        onChange={(e) => handleUpdateHall('description', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1 text-xs">
                        {isAr ? 'الوصف بالإنجليزية:' : 'Description (English):'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedHall.descriptionEn || ''}
                        onChange={(e) => handleUpdateHall('descriptionEn', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. PHOTO LIBRARY EDITOR TAB */}
            {activeTab === 'photos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Photo List (Left Column) */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1">
                    <span>{isAr ? 'اختر صورة من المعرض:' : 'Select Photo to Edit:'}</span>
                    <button
                      type="button"
                      onClick={handleAddNewPhoto}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة صورة' : 'Add Photo'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pb-2 sm:grid-cols-3">
                    {([
                      ['all', isAr ? 'كل الصور' : 'All photos'],
                      ['wedding', isAr ? 'أفراح وزفاف' : 'Weddings'],
                      ['engagement', isAr ? 'خطوبة وعقد قران' : 'Engagements'],
                      ['birthday', isAr ? 'أعياد ميلاد وحفلات' : 'Birthdays & Parties'],
                      ['corporate', isAr ? 'مؤتمرات وقمم' : 'Conferences'],
                    ] as const).map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setPhotoCategoryFilter(value)} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold transition ${photoCategoryFilter === value ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}>{label}</button>
                    ))}
                  </div>
                  {hasDuplicateSources && <p className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-300">{isAr ? 'هناك صور مكررة بنفس المصدر. احذف التكرار أو غيّر الرابط قبل الحفظ.' : 'Duplicate image sources found. Remove duplicates or change the image URL before saving.'}</p>}
                  {hasEmptySources && <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">{isAr ? 'أكمل رابط الصورة أو ارفع ملفاً لكل صورة جديدة قبل الحفظ.' : 'Add an image URL or upload a file for each new photo before saving.'}</p>}
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pe-1">
                    {filteredPhotos.map((p) => {
                      const isSelected = p.id === selectedPhotoId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            sound.tick();
                            setSelectedPhotoId(p.id);
                          }}
                          className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/15 text-white shadow-md'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={p.src}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-10 object-cover rounded-lg shrink-0 border border-slate-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {isAr ? p.titleAr : p.titleEn}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {isAr ? p.hallNameAr : p.hallNameEn} · {p.category}
                            </div>
                          </div>

                          {localPhotos.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(p.id);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title={isAr ? 'حذف الصورة' : 'Delete photo'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photo Form Editor (Right Column) */}
                {selectedPhoto && (
                  <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-amber-300">
                        {isAr ? `تعديل الصورة: ${selectedPhoto.titleAr}` : `Editing: ${selectedPhoto.titleEn}`}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">{selectedPhoto.id}</span>
                    </div>

                    {/* Image Preview & Replacement Box */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-amber-500/30 shrink-0 bg-black">
                        <img
                          src={selectedPhoto.src}
                          alt="preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2 w-full text-xs">
                        <label className="text-slate-300 font-medium block">
                          {isAr ? 'استبدال الصورة برابط أو رفع ملف جديد:' : 'Replace Image (URL or Local File):'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedPhoto.src}
                            onChange={(e) => handleUpdatePhoto('src', e.target.value)}
                            placeholder="Image URL..."
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white truncate focus:outline-none focus:border-amber-400 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isAr ? 'رفع من جهازك' : 'Upload File'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'عنوان الصورة بالعربية:' : 'Photo Title (Arabic):'}
                        </label>
                        <input
                          type="text"
                          value={selectedPhoto.titleAr}
                          onChange={(e) => handleUpdatePhoto('titleAr', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'عنوان الصورة بالإنجليزية:' : 'Photo Title (English):'}
                        </label>
                        <input
                          type="text"
                          value={selectedPhoto.titleEn}
                          onChange={(e) => handleUpdatePhoto('titleEn', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'القاعة المرتبطة بالصورة:' : 'Assigned Hall:'}
                        </label>
                        <select
                          value={selectedPhoto.hallId || 'hall-1'}
                          onChange={(e) => {
                            const h = localHalls.find((item) => item.id === e.target.value);
                            handleUpdatePhoto('hallId', e.target.value);
                            if (h) {
                              handleUpdatePhoto('hallNameAr', h.name);
                              handleUpdatePhoto('hallNameEn', h.nameEn || h.name);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        >
                          {localHalls.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.nameEn || h.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">
                          {isAr ? 'فئة الصورة في المعرض:' : 'Gallery Category:'}
                        </label>
                        <select
                          value={selectedPhoto.category}
                          onChange={(e) => handleUpdatePhoto('category', e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="wedding">{isAr ? 'أفراح وزفاف' : 'Weddings'}</option>
                          <option value="engagement">{isAr ? 'خطوبة وعقد قران' : 'Engagements'}</option>
                          <option value="birthday">{isAr ? 'أعياد ميلاد' : 'Birthdays'}</option>
                          <option value="party">{isAr ? 'حفلات ومناسبات' : 'Parties'}</option>
                          <option value="ballroom">{isAr ? 'القاعة الكبرى' : 'Ballroom'}</option>
                          <option value="kosha">{isAr ? 'الكوشة والديكور' : 'Kosha & Floral'}</option>
                          <option value="dining">{isAr ? 'المائدة والضيافة' : 'Banquets & Dining'}</option>
                          <option value="corporate">{isAr ? 'المؤتمرات' : 'Corporate'}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1 text-xs">
                        {isAr ? 'شرح ووصف الصورة بالعربية:' : 'Caption (Arabic):'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedPhoto.captionAr}
                        onChange={(e) => handleUpdatePhoto('captionAr', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1 text-xs">
                        {isAr ? 'شرح ووصف الصورة بالإنجليزية:' : 'Caption (English):'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedPhoto.captionEn}
                        onChange={(e) => handleUpdatePhoto('captionEn', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-amber-500/15 bg-slate-950/90">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تُحفظ المكتبة في مساحة التخزين المحلية لهذا المتصفح.' : 'The library is saved in this browser’s local storage.'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.click(600);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={hasDuplicateSources || hasEmptySources}
                className={`px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {isSavedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تم الحفظ بنجاح!' : 'Saved Successfully!'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isAr ? 'حفظ كافة التغييرات' : 'Save All Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
