import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Twitter, 
  Mail, 
  ArrowUp, 
  ChevronRight, 
  X, 
  ExternalLink,
  Palette,
  Layers,
  PenTool,
  LogIn,
  LogOut,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---
interface Artwork {
  id: string;
  title: string;
  category: 'Portraits' | 'Sketches' | 'Digital Arts';
  image: string;
  description: string;
  createdAt?: any;
  authorUid: string;
}

// --- Mock Data ---
const ARTWORKS: Artwork[] = [
  { id: '1', title: 'Ethereal Bloom', category: 'Portraits', image: 'https://picsum.photos/seed/art1/800/1000', description: 'A study on organic shapes and fluid colors.', authorUid: 'system' },
  { id: '2', title: 'Urban Solitude', category: 'Sketches', image: 'https://picsum.photos/seed/art2/800/600', description: 'Exploring the quiet corners of a bustling city.', authorUid: 'system' },
  { id: '3', title: 'Digital Dreams', category: 'Digital Arts', image: 'https://picsum.photos/seed/art3/800/800', description: 'Vibrant digital piece inspired by cyberpunk aesthetics.', authorUid: 'system' },
  { id: '4', title: 'Midnight Muse', category: 'Portraits', image: 'https://picsum.photos/seed/art4/800/1100', description: 'Oil on canvas exploring deep blues and shadows.', authorUid: 'system' },
  { id: '5', title: 'Mechanical Heart', category: 'Digital Arts', image: 'https://picsum.photos/seed/art5/800/900', description: 'Intricate line work blending nature and machinery.', authorUid: 'system' },
  { id: '6', title: 'Whispering Woods', category: 'Sketches', image: 'https://picsum.photos/seed/art6/800/700', description: 'Quick charcoal study of forest textures.', authorUid: 'system' },
];

const TESTIMONIALS = [
  { name: "SPICKY", role: "ARTIST", comment: "Art that preserves what matters most" },
  { name: "Marcus Thorne", role: "Gallery Owner", comment: "One of the most promising emerging artists I've had the pleasure of working with." },
];

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <h1 className="font-serif text-2xl font-bold tracking-tight">SPICKY</h1>
        <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#work" className="hover:text-orange-700 transition-colors">Work</a>
          <a href="#about" className="hover:text-orange-700 transition-colors">About</a>
          <a href="#contact" className="hover:text-orange-700 transition-colors">Contact</a>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section id="about" className="min-h-screen flex flex-col justify-center items-start pt-20 px-6 text-left">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <div className="relative w-32 h-32 md:w-48 md:h-48 mr-auto mb-8 group">
          <div className="absolute -inset-2 bg-orange-100/50 rounded-full -z-10 group-hover:scale-105 transition-transform duration-500"></div>
          <div className="relative w-full h-full overflow-hidden rounded-full shadow-xl border-4 border-white">
            <img 
              src="/artist-profile.jpg" 
              alt="SPICKY" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-tight text-left w-full">About Me</h2>
        <p className="text-slate-600 max-w-2xl mr-auto mb-10 text-lg leading-relaxed text-left">
          I’m Spicky, an artist who works in both traditional and digital mediums. I create detailed portraits, sketches, and illustrations using graphite, charcoal, pen, and digital tools. I also take commission work, specializing in custom portrait sketches.
        </p>
        <div className="flex justify-start">
          <a 
            href="#work"
            className="inline-flex items-center gap-2 bg-[#C2410C] text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-orange-800 transition-all hover:gap-4"
          >
            View My Work <ChevronRight size={18} />
          </a>
        </div>
      </motion.div>
    </section>
  );
};

const Gallery = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [filter, setFilter] = useState<'All' | Artwork['category']>('All');
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [newArt, setNewArt] = useState<Partial<Artwork>>({
    title: '',
    category: 'Portraits',
    description: '',
    image: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAIL = "spicky444@gmail.com";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL && currentUser?.emailVerified);
    });

    const q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Artwork[];
      setArtworks(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'artworks');
    });

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsManaging(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAddArt = async () => {
    if (newArt.title && newArt.image && user) {
      try {
        const artData = {
          title: newArt.title,
          category: newArt.category,
          description: newArt.description || '',
          image: newArt.image,
          createdAt: Timestamp.now(),
          authorUid: user.uid
        };
        await addDoc(collection(db, 'artworks'), artData);
        setNewArt({ title: '', category: 'Portraits', description: '', image: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'artworks');
      }
    }
  };

  const handleDeleteArt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      try {
        await deleteDoc(doc(db, 'artworks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `artworks/${id}`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (Firestore limit is 1MB, but we should be safer)
      if (file.size > 800000) {
        alert("Image is too large. Please use an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewArt({ ...newArt, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredArt = filter === 'All' ? artworks : artworks.filter(a => a.category === filter);

  return (
    <section id="work" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-serif text-4xl">Selected Works</h3>
            {isAdmin ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsManaging(!isManaging)}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  {isManaging ? 'Done' : <><Plus size={14}/> Manage</>}
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-red-100 text-red-600 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <LogOut size={14}/> Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <LogIn size={14}/> Admin Login
              </button>
            )}
          </div>
          <p className="text-slate-500 max-w-md">Portrait sketches and artworks created using graphite, charcoal, pen, and digital tools</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold uppercase tracking-widest">
          {['All', 'Portraits', 'Sketches', 'Digital Arts'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`pb-1 border-b-2 transition-all ${filter === cat ? 'border-orange-700 text-orange-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-700 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {isManaging && isAdmin && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 p-8 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <h4 className="font-serif text-xl mb-6">Add New Artwork</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Artwork Title"
                    value={newArt.title}
                    onChange={e => setNewArt({...newArt, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <select 
                    value={newArt.category}
                    onChange={e => setNewArt({...newArt, category: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="Portraits">Portraits</option>
                    <option value="Sketches">Sketches</option>
                    <option value="Digital Arts">Digital Arts</option>
                  </select>
                  <textarea 
                    placeholder="Description"
                    value={newArt.description}
                    onChange={e => setNewArt({...newArt, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24"
                  />
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-orange-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {newArt.image ? (
                    <img src={newArt.image} className="max-h-48 rounded-lg shadow-md" alt="Preview" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <p className="text-sm font-medium">Click to upload artwork image</p>
                      <p className="text-xs">JPG, PNG or WebP (Max 800KB)</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
              <button 
                onClick={handleAddArt}
                disabled={!newArt.title || !newArt.image}
                className="mt-8 w-full md:w-auto bg-orange-700 text-white px-12 py-4 rounded-full font-medium hover:bg-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Gallery
              </button>
            </motion.div>
          )}

          {artworks.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Palette size={48} className="mx-auto mb-4 opacity-20" />
              <p>No artworks found in the gallery.</p>
              {isAdmin && <p className="text-sm mt-2">Click "Manage" to add your first piece!</p>}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode='popLayout'>
                {filteredArt.map((art) => (
                  <motion.div
                    key={art.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      layout: { type: "spring", stiffness: 200, damping: 25 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 }
                    }}
                    whileHover={{ y: -10 }}
                    onClick={() => !isManaging && setSelectedArt(art)}
                    className={`group relative ${isManaging ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {isManaging && isAdmin && (
                      <button 
                        onClick={(e) => handleDeleteArt(art.id, e)}
                        className="absolute top-4 right-4 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4">
                      <img 
                        src={art.image} 
                        alt={art.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {!isManaging && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold">View Detail</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-serif text-xl">{art.title}</h4>
                    <p className="text-sm text-slate-400">{art.category}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedArt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedArt(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-5xl w-full rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-2/3 bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={selectedArt.image} alt={selectedArt.title} className="max-h-full w-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="md:w-1/3 p-8 flex flex-col">
                <button onClick={() => setSelectedArt(null)} className="self-end p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
                <div className="mt-8">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">{selectedArt.category}</span>
                  <h3 className="font-serif text-3xl mt-2 mb-4">{selectedArt.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{selectedArt.description}</p>
                </div>
                <div className="mt-auto pt-8 border-t border-slate-100 flex gap-4">
                   <button className="flex-1 bg-slate-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-black transition-colors">Purchase Print</button>
                   <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><ExternalLink size={18}/></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};



const ArtMediums = () => (
  <section className="py-24 px-6 max-w-7xl mx-auto">
    <div className="mb-16">
      <h3 className="font-serif text-4xl mb-4">Art Mediums</h3>
      <p className="text-slate-500">The tools and techniques I use to create expressive portraits.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-12">
      {[
        { title: 'Graphite & Pencil', desc: 'Detailed portrait sketches focusing on shading, texture, and facial expression.' },
        { title: 'Charcoal', desc: 'Rich contrasts and bold strokes that bring depth and emotion to portraits.' },
        { title: 'Digital Art', desc: 'Portrait illustrations created using modern digital tools and techniques' },
      ].map((item, index) => (
        <div key={index} className="relative p-8 border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors group h-full flex flex-col">
          <h4 className="font-serif text-2xl mb-4 relative z-10">{item.title}</h4>
          <p className="text-slate-500 relative z-10 flex-grow">{item.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 bg-orange-50/50">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <div className="flex justify-center mb-8">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-orange-300"></div>)}
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="min-w-full px-4">
              <p className="font-serif text-2xl italic text-slate-700 mb-6 leading-relaxed">"{t.comment}"</p>
              <h5 className="font-bold text-sm tracking-widest uppercase">{t.name}</h5>
              <p className="text-xs text-slate-400 mt-1">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Contact = () => (
  <section id="contact" className="py-24 px-6 max-w-7xl mx-auto">
    <div className="grid md:grid-cols-2 gap-16">
      <div>
        <h3 className="font-serif text-4xl mb-6">Let's Create <br/>Something Together</h3>
        <p className="text-slate-600 mb-8">Available for commissions, collaborations, and gallery inquiries. Drop me a message and I'll get back to you within 48 hours.</p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-slate-600">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><Mail size={18}/></div>
            <a href="mailto:spicky444@gmail.com" className="hover:text-orange-700 transition-colors">spicky444@gmail.com</a>
          </div>
        </div>
      </div>
      <form className="space-y-6" onSubmit={e => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-6">
          <input type="text" placeholder="Name" className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
          <input type="email" placeholder="Email" className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
        </div>
        <input type="text" placeholder="Subject" className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
        <textarea placeholder="Message" rows={5} className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"></textarea>
        <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200">Send Message</button>
      </form>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 border-t border-slate-100">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
      <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SPICKY ART. All rights reserved.</p>
      <div className="flex gap-8 text-slate-400">
        <a href="#" className="hover:text-orange-700 transition-colors"><Instagram size={20}/></a>
        <a href="#" className="hover:text-orange-700 transition-colors"><Twitter size={20}/></a>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-black transition-colors"
        >
          Back to top <ArrowUp size={16} />
        </button>
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
      <Navbar />
      <Hero />
      <Gallery />
      <ArtMediums />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
