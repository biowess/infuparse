import { useState, useEffect } from 'react';
import { Trash2, ArrowRight, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

type BookmarkItem = {
  id: string;
  query: string;
  result: string;
  date: string;
};

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('clincalc_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('clincalc_bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const removeBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(newBookmarks);
    localStorage.setItem('clincalc_bookmarks', JSON.stringify(newBookmarks));
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <header className="mb-12">
        <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-4">
          Bookmarks
        </h1>
        <p className="text-[18px] text-framer-silver">
          Saved calculations and frequently used expressions.
        </p>
      </header>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-[15px] bg-[#090909]">
          <Bookmark className="w-8 h-8 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No bookmarks yet</h3>
          <p className="text-framer-silver text-[14px]">
            Save calculations from the workspace to access them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-[#090909] border border-white/10 rounded-[15px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-colors">
              <div className="flex-1">
                <div className="text-[12px] text-framer-silver mb-2">{new Date(bookmark.date).toLocaleString()}</div>
                <div className="font-mono text-white text-[14px] mb-3 bg-white/5 inline-block px-3 py-1.5 rounded-[6px]">
                  {bookmark.query}
                </div>
                <div className="text-[24px] font-medium text-white">
                  {bookmark.result}
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end md:self-center">
                <button
                  onClick={() => removeBookmark(bookmark.id)}
                  className="p-2 text-framer-silver hover:text-framer-blue bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <Link
                  to={`/?q=${encodeURIComponent(bookmark.query)}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-[40px] text-[14px] font-medium hover:bg-white/90 transition-colors"
                >
                  Reopen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

