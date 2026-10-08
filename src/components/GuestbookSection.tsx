import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareHeart, Heart, Send, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { GuestWish, FloralTheme } from '../types';
import { WatercolorDivider } from './WatercolorFlorals';
import { BotanicalRoseHeaderOrnament } from './BotanicalRoseDecorations';
import { addWishToFirestore } from '../services/firebase';
import { GOOGLE_APPS_SCRIPT_URL } from '../services/googleAppsScript';

interface GuestbookSectionProps {
  wishes: GuestWish[];
  onAddWish: (wish: Omit<GuestWish, 'id' | 'timestamp' | 'likesCount'>) => void;
  onLikeWish: (wishId: string) => void;
  theme: FloralTheme;
}

export const GuestbookSection: React.FC<GuestbookSectionProps> = ({
  wishes,
  onAddWish,
  onLikeWish,
  theme,
}) => {
  const [senderName, setSenderName] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showAllWishes, setShowAllWishes] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) return;

    setIsPosting(true);

    const wishPayload = {
      senderName: senderName.trim(),
      relationship,
      message: message.trim(),
      attendance: 'attending' as const,
    };

    // 1. If connected to Firebase, save wish directly to Firestore
    try {
      await addWishToFirestore({
        senderName: wishPayload.senderName,
        relationship: wishPayload.relationship,
        message: wishPayload.message,
      });
    } catch (firestoreErr) {
      console.warn('Firestore wish save notice:', firestoreErr);
    }

    // Keep public blessings separate from private RSVP notes in the spreadsheet.
    try {
      const wishData = new URLSearchParams();
      wishData.append('action', 'wish');
      wishData.append('senderName', wishPayload.senderName);
      wishData.append('relationship', wishPayload.relationship);
      wishData.append('message', wishPayload.message);

      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: wishData,
        mode: 'no-cors',
      });
    } catch (sheetErr) {
      console.error('Google Sheets blessing submission failed:', sheetErr);
    }

    setTimeout(() => {
      onAddWish(wishPayload);
      setMessage('');
      setIsPosting(false);
    }, 300);
  };

  const relationshipOptions = [
    'Friend',
    'Close Family',
    'Colleague',
    'University Friend',
    'High School Mate',
    'Relative',
    'Neighbor',
  ];

  const INITIAL_VISIBLE_COUNT = 3;
  const displayedWishes = showAllWishes ? wishes : (wishes || []).slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = Math.max(0, (wishes?.length || 0) - INITIAL_VISIBLE_COUNT);

  return (
    <section id="wishes" className="relative py-20 px-4 sm:px-6 bg-[#F7F3EC] overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#E8BCC8]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-[#C9D5B5]/20 blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Section Header with reveal on scroll */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-sans-body uppercase tracking-[0.3em] text-[#8C6D3B] font-semibold">
            <span className="w-8 h-px bg-[#C5A059]/70" />
            A Garden of Kind Words
            <span className="w-8 h-px bg-[#C5A059]/70" />
          </span>
          <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#2E2420] mt-3">
            Wedding Guestbook & Blessings
          </h2>
          <h3 dir="rtl" className="font-serif-display text-2xl sm:text-3xl font-bold text-[#2E2420] mt-2 mb-3" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
            دفتر الزوار والأمنيات
          </h3>
          <BotanicalRoseHeaderOrnament theme={theme} className="my-3" />
          <p className="font-serif-display text-sm sm:text-base text-[#76665A] max-w-lg mx-auto italic leading-relaxed">
            “Your presence and prayers are the sweetest flowers in the garden of our new life.”
          </p>
        </motion.div>

        {/* Input Form Card with reveal on scroll */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-[#FFFCF7] border border-[#C5A059]/35 rounded-[2rem] p-6 sm:p-9 shadow-[0_18px_55px_rgba(85,65,45,0.09)] text-left mb-14 max-w-3xl mx-auto overflow-hidden"
        >
          <div className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-[#C5A059]/70 to-transparent" />
          <div className="text-center mb-6">
            <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-[#F4EBE0] border border-[#DFC186]/60 mb-2">
              <MessageSquareHeart className="w-5 h-5 text-[#A77D46]" />
            </span>
            <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-[#2E2420]">
              Leave a Loving Note
            </h3>
            <p className="text-xs font-sans-body text-[#8C7A6B] mt-1">
              Add your voice to our keepsake of blessings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-serif-display font-semibold uppercase tracking-wider text-[#3D2B24] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Williams"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#E5D9C9] text-sm text-[#2E2420] placeholder:text-[#B0A397] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif-display font-semibold uppercase tracking-wider text-[#3D2B24] mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#E5D9C9] text-sm text-[#2E2420] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-colors"
                >
                  {relationshipOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-serif-display font-semibold uppercase tracking-wider text-[#3D2B24] mb-1">
                Your Prayers & Warm Wishes
              </label>
              <textarea
                required
                rows={4}
                placeholder="Wishing you a lifetime of endless love, laughter, and happiness together..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#E5D9C9] text-sm text-[#2E2420] placeholder:text-[#B0A397] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPosting}
              className="w-full sm:w-auto mx-auto px-7 py-3 rounded-full text-white font-sans-body font-semibold text-xs tracking-[0.14em] uppercase flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPosting ? 'Posting Blessing...' : 'Post Blessing'}</span>
            </button>
          </form>
        </motion.div>

        {/* Blessings are displayed as keepsake cards. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <AnimatePresence initial={false}>
              {(displayedWishes || []).map((wish, index) => {
                return (
                  <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group relative min-h-52 bg-[#FFFCF7] border border-[#E6D9C8] rounded-[1.6rem] p-5 sm:p-6 shadow-[0_12px_32px_rgba(85,65,45,0.07)] hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(85,65,45,0.12)] hover:border-[#C5A059]/60 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#C5A059]/65 to-transparent" />
                    <div className="absolute -bottom-7 -right-5 w-24 h-24 rounded-full border border-[#D8C5A8]/25 group-hover:scale-110 transition-transform" />
                    <div className="relative flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-serif-display font-bold text-white shrink-0 shadow-sm text-sm ring-4 ring-[#F6F0E6]"
                        style={{ backgroundColor: theme.accentColor || theme.primaryColor }}
                      >
                        {wish.senderName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <span className="block font-serif-display font-bold text-base text-[#2E2420] truncate">
                          {wish.senderName}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[10px] font-sans-body text-[#8C6D3B]">
                            {wish.relationship}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#C5A059]/70" />
                          <span className="text-[10px] text-[#A6988D] font-sans-body">
                            {wish.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-5 pt-4 border-t border-[#E9E0D4]">
                      <Quote className="absolute -top-2.5 right-0 w-5 h-5 text-[#C5A059]/70 fill-[#F1E5D1]" />
                      <p className="font-serif-display text-sm sm:text-base text-[#5E4E44] leading-relaxed whitespace-pre-wrap pr-6">
                        {wish.message}
                      </p>
                    </div>

                    <div className="relative flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => onLikeWish(wish.id)}
                        aria-label={`Like ${wish.senderName}'s blessing`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F1E8] border border-[#E8DECf] text-xs text-[#8C7A6B] hover:text-[#B66B7D] hover:border-[#C38D9E]/50 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#C38D9E]" />
                        <span>{wish.likesCount}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {wishes.length === 0 && (
            <div className="bg-[#FFFCF7]/80 border border-dashed border-[#D9C8AE] rounded-[1.6rem] py-10 px-5 text-center">
              <Heart className="w-6 h-6 text-[#C38D9E] mx-auto mb-3" />
              <p className="font-serif-display text-lg text-[#5E4E44]">Your blessing can be the first flower.</p>
              <p className="text-xs text-[#8C7A6B] mt-1">Leave a note for the happy couple above.</p>
            </div>
          )}

          {/* Fade the final visible keepsake while more blessings are collapsed. */}
          {!showAllWishes && wishes && wishes.length > INITIAL_VISIBLE_COUNT && (
            <div className="pointer-events-none absolute bottom-12 inset-x-0 h-20 bg-gradient-to-t from-[#F7F3EC] via-[#F7F3EC]/75 to-transparent z-10" />
          )}

          {/* View More / Show Less Toggle Button */}
          {wishes && wishes.length > INITIAL_VISIBLE_COUNT && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex justify-center ${!showAllWishes ? 'relative z-20 -mt-5' : 'pt-4'}`}
            >
              <button
                type="button"
                onClick={() => setShowAllWishes((prev) => !prev)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white border border-[#DFC186] text-[#3D2B24] text-xs font-serif-display font-semibold tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer group backdrop-blur-xs"
              >
                <span>
                  {showAllWishes
                    ? 'Show Less'
                    : `View More Wishes (${remainingCount} more)`}
                </span>
                {showAllWishes ? (
                  <ChevronUp className="w-4 h-4 text-[#C5A059] group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#C5A059] group-hover:translate-y-0.5 transition-transform" />
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
