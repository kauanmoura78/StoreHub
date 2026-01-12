
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Product, User, CartItem, ThemeMode, CategoryType, Toast 
} from './types';
import { Icons } from './constants';
import { geminiService } from './services/geminiService';

// --- Components ---

const Notification: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);
  const bgClass = toast.type === 'error' ? 'bg-red-600' : 'bg-zinc-800';
  return (
    <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] p-4 pr-10 max-w-[90vw] rounded-xl text-white shadow-2xl flex items-center gap-3 animate-slide-in backdrop-blur-md ${bgClass} bg-opacity-90 overflow-hidden border border-white/10 pointer-events-auto`}>
      <div className="font-bold text-xs sm:text-sm">{toast.message}</div>
      <div className="toast-progress"></div>
    </div>
  );
};

// --- App ---

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  
  // Persistence initialization
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sh_users');
    return saved ? JSON.parse(saved) : [{ id: 'admin-id', name: 'Administrador', email: 'admin', password: '0110', isAdmin: true }];
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sh_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sh_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'category-page'>('home');
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'profile' | 'cart' | 'productForm' | 'chat' | 'terms' | 'how-it-works' | 'details' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productSectionRef = useRef<HTMLDivElement>(null);
  const categorySectionRef = useRef<HTMLDivElement>(null);

  // Persistence Effects
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sh_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user) localStorage.setItem('sh_current_user', JSON.stringify(user));
    else localStorage.removeItem('sh_current_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sh_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sh_cart', JSON.stringify(cart));
  }, [cart]);

  // Helper para cores dinâmicas baseadas no tema
  const themeColor = theme === 'dark' ? '#00ff88' : '#ff5e00'; // Verde Neon vs Laranja Neon
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const themeBorder = theme === 'dark' ? 'border-[#00ff88]' : 'border-[#ff5e00]';
  const themeBg = theme === 'dark' ? 'bg-[#00ff88]' : 'bg-[#ff5e00]';

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (viewMode !== 'home') {
      setViewMode('home');
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, activeCategory]);

  const topCategories = (['all', 'games', 'accounts', 'skins', 'giftcards', 'services', 'discord', 'brawlhalla'] as CategoryType[]);

  const getModalSizeClass = () => {
    switch (activeModal) {
      case 'login':
      case 'register':
      case 'profile':
      case 'productForm':
      case 'details': 
        return 'max-w-md md:max-w-2xl'; 
      case 'chat':
        return 'max-w-lg md:max-w-3xl';
      default:
        return 'max-w-lg md:max-w-4xl'; 
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${theme === 'dark' ? 'gradient-bg' : 'bg-[#e4e4e7]'}`}>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9990] flex flex-col items-end justify-start p-4 gap-2">
        {toasts.map(t => <Notification key={t.id} toast={t} onClose={(id) => setToasts(prev => prev.filter(x => x.id !== id))} />)}
      </div>

      {/* MOBILE MENU DRAWER */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[85%] sm:w-80 transition-transform duration-500 shadow-2xl p-6 sm:p-8 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-[#000d0a] text-white border-l border-[#00ff88]/20' : 'bg-white text-zinc-900 border-l border-orange-200'}`}>
          <div className="flex justify-between items-center mb-10">
            <h3 className={`text-lg sm:text-xl font-black font-grotesk tracking-widest uppercase text-glow`}>Menu Hub</h3>
            <button onClick={() => setMobileMenuOpen(false)} className={`p-2 hover:rotate-90 transition-transform duration-300 ${themeText}`}><Icons.Close className="w-6 h-6" /></button>
          </div>
          
          <nav className="flex flex-col gap-5 sm:gap-6">
            <button onClick={() => { setViewMode('home'); window.scrollTo({top:0, behavior:'smooth'}); setMobileMenuOpen(false); }} className={`text-left text-xl sm:text-2xl font-black uppercase tracking-tighter hover:${themeText} transition-colors flex items-center gap-4 group`}>
              <span className={`w-2 h-2 rounded-full ${themeBg} opacity-0 group-hover:opacity-100 transition-opacity`}></span> Início
            </button>
            <button onClick={() => scrollToSection(productSectionRef)} className={`text-left text-xl sm:text-2xl font-black uppercase tracking-tighter hover:${themeText} transition-colors flex items-center gap-4 group`}>
              <span className={`w-2 h-2 rounded-full ${themeBg} opacity-0 group-hover:opacity-100 transition-opacity`}></span> Produtos
            </button>
            <button onClick={() => { setActiveModal('how-it-works'); setMobileMenuOpen(false); }} className={`text-left text-xl sm:text-2xl font-black uppercase tracking-tighter hover:${themeText} transition-colors flex items-center gap-4 group`}>
              <span className={`w-2 h-2 rounded-full ${themeBg} opacity-0 group-hover:opacity-100 transition-opacity`}></span> Operação
            </button>
          </nav>

          <div className="mt-auto pt-8 border-t border-black/5 dark:border-white/5 flex flex-col gap-3 sm:gap-4">
            {user ? (
              <>
                <div className={`flex items-center gap-4 mb-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-orange-50 border-orange-100'}`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black flex items-center justify-center overflow-hidden border-2 ${theme === 'dark' ? 'border-[#00ff88]/30' : 'border-[#ff5e00]/30'} shadow-lg`}>
                    {user.profilePhotoUrl || user.profilePhotoData ? <img src={user.profilePhotoUrl || user.profilePhotoData} className="w-full h-full object-cover" /> : <span className={themeText}>{user.name[0]}</span>}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`font-black uppercase tracking-tight leading-none mb-1 truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{user.name}</p>
                    <p className={`text-[10px] uppercase font-bold opacity-60 truncate ${themeText}`}>{user.isAdmin ? 'ADMINISTRADOR' : 'Membro'}</p>
                  </div>
                </div>
                <button onClick={() => { setActiveModal('profile'); setMobileMenuOpen(false); }} className={`w-full py-4 sm:py-5 rounded-xl border font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] ${theme === 'dark' ? 'border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/5' : 'border-[#ff5e00]/20 text-[#ff5e00] hover:bg-[#ff5e00]/5'} transition-all`}>Meu Perfil</button>
                <button onClick={() => { setUser(null); setMobileMenuOpen(false); addToast('Sessão encerrada'); }} className="w-full py-4 sm:py-5 rounded-xl bg-red-500/10 text-red-500 font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] hover:bg-red-500/20 transition-all">Sair</button>
              </>
            ) : (
              <>
                <button onClick={() => { setActiveModal('login'); setMobileMenuOpen(false); }} className={`w-full py-5 sm:py-6 rounded-xl border font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/5' : 'border-zinc-300 text-zinc-900 hover:bg-zinc-100'} transition-all`}>Login</button>
                <button onClick={() => { setActiveModal('register'); setMobileMenuOpen(false); }} className={`w-full py-5 sm:py-6 rounded-xl btn-primary font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl`}>Criar Perfil</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-3xl border-b transition-all duration-500 ${theme === 'dark' ? 'bg-black/60 border-[#00ff88]/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-[#e4e4e7]/80 border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 cursor-pointer shrink-0 group" onClick={() => { setViewMode('home'); window.scrollTo({top:0, behavior:'smooth'}); }}>
            <div className={`w-9 h-9 sm:w-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 group-hover:rotate-6 ${theme === 'dark' ? 'bg-[#00ff88] text-[#002b1b] shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-[#ff5e00] text-white shadow-[0_0_20px_rgba(255,94,0,0.3)]'}`}>
              <Icons.Logo className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" />
            </div>
            <h1 className={`text-lg sm:text-xl md:text-2xl font-black font-grotesk tracking-tighter hidden sm:block text-glow`}>StoreHub</h1>
          </div>

          <div className="flex-1 max-w-md mx-4 lg:mx-12 relative group hidden sm:block">
            <input 
              type="text" 
              placeholder="Pesquisar ativos..." 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full px-5 py-2.5 md:py-3 rounded-2xl outline-none text-xs md:text-sm border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white focus:border-[#00ff88] focus:shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'bg-white border-zinc-200 text-zinc-900 focus:border-[#ff5e00] focus:shadow-[0_0_20px_rgba(255,94,0,0.1)]'}`} 
            />
            <div className={`absolute right-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-all ${themeText}`}>
              <Icons.Search className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2.5 sm:p-3 rounded-xl transition-all hover:scale-110 active:scale-90 ${theme === 'dark' ? 'hover:bg-white/5 text-[#00ff88]' : 'hover:bg-white text-[#ff5e00] shadow-sm'}`}>
              {theme === 'dark' ? <Icons.Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Icons.Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button onClick={() => setActiveModal('cart')} className={`relative p-2.5 sm:p-3 rounded-xl transition-all hover:scale-110 active:scale-90 ${theme === 'dark' ? 'hover:bg-white/5 text-[#00ff88]' : 'hover:bg-white text-[#ff5e00] shadow-sm'}`}>
              <Icons.Cart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cart.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white/20">{cart.length}</span>}
            </button>
            
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <button onClick={() => setActiveModal('profile')} className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl border-2 transition-all hover:border-opacity-100 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white hover:border-[#00ff88]/50' : 'bg-white border-white text-zinc-900 shadow-sm hover:border-[#ff5e00]/50'}`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-[10px] sm:text-[11px] flex items-center justify-center overflow-hidden border-2 ${theme === 'dark' ? 'border-[#00ff88]/30' : 'border-[#ff5e00]/30'}`}>
                    {user.profilePhotoUrl || user.profilePhotoData ? <img src={user.profilePhotoUrl || user.profilePhotoData} className="w-full h-full object-cover" /> : user.name[0]}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  {user.isAdmin && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-opacity-20 ${theme === 'dark' ? 'bg-[#00ff88] text-[#00ff88]' : 'bg-[#ff5e00] text-[#ff5e00]'}`}>ADM</span>}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveModal('login')} className={`px-5 py-2.5 rounded-xl text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-black opacity-60 hover:opacity-100 transition-all ${themeText}`}>Entrar</button>
                  <button onClick={() => setActiveModal('register')} className={`px-8 py-3 rounded-xl btn-primary text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-black shadow-lg transition-all hover:scale-105`}>Cadastrar</button>
                </div>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(true)} className={`md:hidden p-2.5 rounded-xl transition-all active:scale-90 border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-[#00ff88]' : 'bg-white border-zinc-200 text-[#ff5e00] shadow-sm'}`}>
              <Icons.Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-20 md:pt-28">
        {viewMode === 'home' ? (
          <>
            {/* HERO */}
            <section className="relative py-16 md:py-28 px-4 overflow-hidden">
              <div className={`absolute top-0 left-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full blur-[100px] md:blur-[150px] animate-pulse-glow pointer-events-none ${theme === 'dark' ? 'bg-[#00ff88]/10' : 'bg-[#ff5e00]/15'}`}></div>
              <div className="max-w-7xl mx-auto text-center relative z-10">
                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-8 md:mb-12 animate-fade-in shadow-[0_0_30px_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' : 'bg-[#ff5e00]/10 border-[#ff5e00]/20 text-[#ff5e00]'}`}>
                  <span className={`w-2 h-2 rounded-full animate-ping ${themeBg}`}></span> Plataforma Certificada
                </div>
                
                <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black font-grotesk leading-[0.9] mb-8 md:mb-10 tracking-tighter uppercase animate-slide-in">
                  Ativos Digitais <br/> 
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r drop-shadow-[0_0_20px_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'from-[#00ff88] via-[#00d2ff] to-[#00a896]' : 'from-[#ff5e00] via-[#ff9100] to-[#ff2a00]'}`}>Premium Hub</span>
                </h2>
                
                <p className={`max-w-3xl mx-auto text-base sm:text-lg md:text-2xl font-medium mb-12 md:mb-16 px-4 leading-relaxed ${theme === 'dark' ? 'text-zinc-500/80' : 'text-zinc-500'}`}>
                  Ecossistema seguro e brilhante para transações de alta performance com entrega instantânea.
                </p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 animate-fade-in px-4">
                   <div className={`flex items-center gap-6 px-8 py-5 md:px-10 md:py-6 rounded-[2rem] md:rounded-[2.5rem] glass-card border-2 transition-all w-full md:w-auto justify-center md:justify-start ${theme === 'dark' ? 'border-[#00ff88]/10' : 'border-white bg-white shadow-xl'}`}>
                      <div className={`text-4xl md:text-5xl font-black font-grotesk tracking-tighter text-glow`}>50k+</div>
                      <div className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] opacity-40 text-left leading-tight">Clientes <br/> Satisfeitos</div>
                   </div>
                   <button onClick={() => scrollToSection(productSectionRef)} className={`w-full md:w-auto px-10 py-6 md:px-20 md:py-10 rounded-[2rem] md:rounded-[2.5rem] btn-primary text-lg md:text-2xl font-black shadow-xl active:scale-95 transition-all shimmer`}>
                     Explorar Comunidade
                   </button>
                </div>
              </div>
            </section>

            {/* CATEGORIES GRID */}
            <section ref={categorySectionRef} className={`py-12 md:py-20 border-y backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-zinc-950/50 border-[#00ff88]/10' : 'bg-white/50 border-white/50'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                <h3 className="text-2xl md:text-4xl font-black font-grotesk uppercase tracking-tighter mb-8 md:mb-12">
                   Setup <span className={`text-glow`}>Auditado</span> por Categorias
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-5 md:gap-6">
                  {topCategories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => { setActiveCategory(cat); addToast(`Sincronizando: ${cat}`); }} 
                      className={`group p-4 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 sm:gap-5 transition-all duration-500 ${activeCategory === cat ? (theme === 'dark' ? 'bg-[#00ff88] border-[#00ff88] text-[#002b1b] shadow-[0_0_30px_rgba(0,255,136,0.4)] scale-105 sm:scale-110' : 'bg-[#ff5e00] border-[#ff5e00] text-white shadow-xl scale-105 sm:scale-110') : (theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500 hover:border-[#00ff88]/50 hover:text-[#00ff88]' : 'bg-white border-transparent text-zinc-400 hover:border-[#ff5e00]/50 hover:text-[#ff5e00] shadow-md')}`}
                    >
                      <div className="scale-100 sm:scale-125 md:scale-150 transition-all duration-700 group-hover:scale-125 md:group-hover:scale-[1.8] group-hover:-rotate-12 group-hover:animate-pulse-glow">
                        {
                          cat === 'all' ? <Icons.Grid /> :
                          cat === 'giftcards' ? <Icons.Ticket /> : 
                          cat === 'games' ? <Icons.Gamepad /> : 
                          cat === 'accounts' ? <Icons.User /> :
                          cat === 'skins' ? <Icons.Ghost /> :
                          cat === 'services' ? <Icons.Shield /> : 
                          cat === 'discord' ? <Icons.Discord /> : 
                          cat === 'brawlhalla' ? <Icons.Swords /> :
                          <Icons.Logo />
                        }
                      </div>
                      <span className="text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] truncate w-full">{cat === 'all' ? 'Tudo' : cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* DESTAQUES */}
            <section ref={productSectionRef} className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
                  <h3 className="text-3xl md:text-6xl font-black font-grotesk tracking-tighter uppercase">Destaques <span className={`text-glow`}>Premium</span></h3>
                  
                  <button 
                    onClick={() => setViewMode('category-page')} 
                    className={`flex md:hidden items-center gap-2 px-4 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest border-2 transition-all ${theme === 'dark' ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]' : 'bg-[#ff5e00]/10 border-[#ff5e00]/30 text-[#ff5e00] shadow-sm'}`}
                  >
                    Ver Tudo <Icons.ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                
                <button 
                  onClick={() => setViewMode('category-page')} 
                  className={`hidden md:flex items-center gap-4 px-10 py-4 rounded-full font-black uppercase text-[12px] tracking-[0.3em] border-2 transition-all ${theme === 'dark' ? 'bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/15 hover:border-[#00ff88]/60 hover:shadow-[0_0_25px_rgba(0,255,136,0.2)]' : 'bg-white border-zinc-200 text-[#ff5e00] hover:bg-[#ff5e00]/5 hover:border-[#ff5e00]/50 shadow-md'}`}
                >
                  Explorar Catálogo <Icons.ArrowRight className="w-5 h-5" />
                </button>
                
                {user?.isAdmin && (
                  <button onClick={() => {setEditingProduct(null); setActiveModal('productForm');}} className={`w-full md:w-auto px-6 py-3 rounded-2xl border-2 font-black text-xs transition-all uppercase tracking-widest ${theme === 'dark' ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40 hover:bg-[#00ff88]/30' : 'bg-[#ff5e00]/20 text-[#ff5e00] border-[#ff5e00]/40 hover:bg-[#ff5e00]/30'}`}>+ Adicionar Ativo</button>
                )}
              </div>

              {/* GRID DE PRODUTOS */}
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-20 opacity-50">
                  <Icons.Ghost className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm">Nenhum ativo encontrado no Hub</p>
                  {user?.isAdmin && <p className="text-xs mt-2">Clique em "+ Adicionar Ativo" para começar</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                  {filteredProducts.map(p => (
                    <div key={p.id} className={`relative group glass-card p-6 sm:p-7 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-700 hover:-translate-y-3 ${theme === 'dark' ? 'border-white/5 hover:border-[#00ff88]/60 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]' : 'bg-white border-zinc-100 hover:border-[#ff5e00]/50'} ${p.outOfStock ? 'opacity-80' : ''}`}>
                      
                      <div className={`relative aspect-square md:aspect-[4/3] rounded-[1.8rem] md:rounded-[2rem] mb-6 md:mb-8 flex items-center justify-center overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-zinc-950/90 shadow-inner' : 'bg-zinc-100 shadow-inner'}`}>
                        {p.customImageUrl || p.customImageData ? (
                          <img src={p.customImageUrl || p.customImageData} className={`w-full h-full object-cover group-hover:scale-115 transition-transform duration-1000 ${p.outOfStock ? 'grayscale' : ''}`} />
                        ) : (
                          <div className={`${themeText} scale-[2] md:scale-[2.5] transition-transform duration-700 group-hover:scale-[2.5] md:group-hover:scale-[3] group-hover:animate-pulse-glow ${p.outOfStock ? 'grayscale opacity-50' : ''}`}><Icons.Logo /></div>
                        )}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent ${p.outOfStock ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-700 flex items-end p-4 md:p-6`}>
                          <span className={`text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${p.outOfStock ? '' : 'translate-y-4 group-hover:translate-y-0'} transition-transform duration-700`}>{p.outOfStock ? 'Esgotado' : 'Em Estoque'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-2 md:mb-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                        <Icons.Star className="w-4 h-4" />
                        <span className={`text-[12px] md:text-[13px] font-black ml-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{p.rating.toFixed(1)}</span>
                      </div>
                      
                      <h4 className={`text-lg sm:text-xl md:text-2xl font-black mb-1 md:mb-1.5 truncate leading-tight uppercase tracking-tighter hover:${themeText} transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} ${p.outOfStock ? 'line-through opacity-50' : ''}`}>{p.name}</h4>
                      <p className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-6 md:mb-8 shrink-0 opacity-40">{p.seller}</p>
                      
                      <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-black opacity-20 tracking-[0.4em] mb-1">Custo Hub</span>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-xl sm:text-2xl md:text-3xl font-black font-grotesk text-glow ${p.outOfStock ? 'opacity-50' : ''}`}>R$ {p.price.toFixed(2)}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-zinc-500 line-through font-bold">R$ {p.originalPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <button 
                          disabled={p.outOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if(!user) { setActiveModal('login'); addToast('Autenticação Hub Requerida', 'error'); return; }
                            setCart(prev => [...prev, {product: p, quantity: 1}]);
                            addToast('Ativo Alocado ao Carrinho!');
                          }} 
                          className={`p-4 md:p-5 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-xl ${p.outOfStock ? 'bg-zinc-500 cursor-not-allowed opacity-50' : (theme === 'dark' ? 'bg-[#00ff88] text-[#002b1b] shadow-[0_0_25px_rgba(0,255,136,0.3)]' : 'bg-[#ff5e00] text-white shadow-[0_10px_20px_rgba(255,94,0,0.3)]')}`}
                        >
                          <Icons.Cart className="w-5 h-5 md:w-6.5 md:h-6.5" />
                        </button>
                      </div>
                      
                      <button 
                        disabled={p.outOfStock}
                        onClick={() => { setSelectedProduct(p); setActiveModal('details'); }} 
                        className={`w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-[1.8rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] border-2 transition-all ${p.outOfStock ? 'border-zinc-500 text-zinc-500 cursor-not-allowed bg-transparent hover:bg-transparent opacity-50' : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-[#00ff88]/15 hover:border-[#00ff88]/60 text-white' : 'bg-zinc-50 border-zinc-200 hover:bg-[#ff5e00]/10 hover:border-[#ff5e00]/50 text-zinc-700 hover:text-[#ff5e00]')}`}
                      >
                        {p.outOfStock ? 'Indisponível' : 'Dossiê Completo'}
                      </button>

                      {user?.isAdmin && (
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation(); 
                              e.nativeEvent.stopImmediatePropagation();
                              setEditingProduct(p); 
                              setActiveModal('productForm'); 
                            }}
                            className={`p-2 rounded-full border-2 transition-all hover:scale-110 shadow-lg cursor-pointer ${theme === 'dark' ? 'bg-black/90 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#002b1b]' : 'bg-white border-[#ff5e00] text-[#ff5e00] hover:bg-[#ff5e00] hover:text-white'}`}
                          >
                            <Icons.Edit className="w-4 h-4 pointer-events-none" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* CATEGORY PAGE VIEW */
          <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 min-h-screen animate-fade-in">
            <button onClick={() => setViewMode('home')} className={`group mb-10 md:mb-12 flex items-center gap-4 md:gap-5 font-black uppercase text-xs tracking-[0.4em] transition-all hover:translate-x-[-8px] ${themeText}`}>
              <span className="text-2xl md:text-3xl">←</span> Retornar ao Dashboard
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-12 md:mb-16">
              <div>
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-black font-grotesk uppercase tracking-tighter leading-[0.85]">
                  Set: <span className={`text-glow`}>{activeCategory === 'all' ? 'Completo' : activeCategory}</span>
                </h2>
                <div className={`w-24 md:w-36 h-2 md:h-2.5 bg-gradient-to-r ${theme === 'dark' ? 'from-[#00ff88] to-[#00d2ff]' : 'from-[#ff5e00] to-[#ff9100]'} rounded-full mt-6 md:mt-10 shadow-lg`}></div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
               <div className="col-span-full text-center py-20 opacity-50">
                 <Icons.Ghost className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p className="font-black uppercase tracking-widest text-sm">Nenhum ativo encontrado nesta categoria</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                {filteredProducts.map(p => (
                  <div key={p.id} className={`relative group glass-card p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-700 hover:-translate-y-4 ${theme === 'dark' ? 'border-white/5 hover:border-[#00ff88]/60 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl hover:border-[#ff5e00]/50'} ${p.outOfStock ? 'opacity-80' : ''}`}>
                    
                    <div className={`relative aspect-square rounded-[1.8rem] md:rounded-[2rem] mb-6 md:mb-8 flex items-center justify-center overflow-hidden transition-all duration-1000 ${theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
                      {p.customImageUrl || p.customImageData ? <img src={p.customImageUrl || p.customImageData} className={`w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000 ${p.outOfStock ? 'grayscale' : ''}`} /> : <div className={`${themeText} scale-[2.5] group-hover:animate-pulse-glow ${p.outOfStock ? 'grayscale opacity-50' : ''}`}><Icons.Logo /></div>}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${p.outOfStock ? 'opacity-100' : 'opacity-0'}`}>
                          <span className="text-white font-black text-xl uppercase tracking-[0.2em] border-2 border-white px-4 py-2 rotate-[-12deg]">Esgotado</span>
                      </div>
                    </div>
                    <h4 className={`text-lg md:text-2xl font-black truncate uppercase tracking-tighter mb-3 md:mb-4 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} ${p.outOfStock ? 'line-through opacity-50' : ''}`}>{p.name}</h4>
                    <div className="flex flex-col mb-8 md:mb-10">
                      <span className={`font-black text-2xl md:text-3xl text-glow ${p.outOfStock ? 'opacity-50' : ''}`}>R$ {p.price.toFixed(2)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-zinc-500 line-through font-bold">R$ {p.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button 
                      disabled={p.outOfStock}
                      onClick={() => { setSelectedProduct(p); setActiveModal('details'); }} 
                      className={`w-full py-5 md:py-6 rounded-[1.8rem] btn-primary uppercase font-black text-xs md:text-sm tracking-[0.4em] shadow-2xl shimmer ${p.outOfStock ? 'bg-zinc-500 cursor-not-allowed opacity-50' : ''}`}
                    >
                      {p.outOfStock ? 'Indisponível' : 'Ver Ativo'}
                    </button>

                    {user?.isAdmin && (
                      <div className="absolute top-4 right-4 z-50 flex gap-2">
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation(); 
                              e.nativeEvent.stopImmediatePropagation();
                              setEditingProduct(p); 
                              setActiveModal('productForm'); 
                            }}
                            className={`p-2 rounded-full border-2 transition-all hover:scale-110 shadow-lg cursor-pointer ${theme === 'dark' ? 'bg-black/90 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#002b1b]' : 'bg-white border-[#ff5e00] text-[#ff5e00] hover:bg-[#ff5e00] hover:text-white'}`}
                          >
                            <Icons.Edit className="w-4 h-4 pointer-events-none" />
                          </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`py-16 md:py-32 border-t-2 transition-colors ${theme === 'dark' ? 'bg-[#000d0a] border-[#00ff88]/10' : 'bg-zinc-100 border-orange-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 mb-12 md:mb-20">
            <div className="col-span-1 md:col-span-2 space-y-6 md:space-y-10">
              <div className="flex items-center gap-4 md:gap-5">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-[#00ff88] text-[#002b1b]' : 'bg-[#ff5e00] text-white'}`}>
                  <Icons.Logo className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h2 className={`text-2xl md:text-3xl font-black font-grotesk text-glow`}>StoreHub</h2>
              </div>
              <p className="text-zinc-500 max-w-lg text-base md:text-xl leading-relaxed font-medium">Ecossistema certificado para ativos digitais de alta performance. Segurança auditada e entrega automatizada com brilho neon.</p>
            </div>
            
            <div className="space-y-6 md:space-y-8">
               <h4 className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-glow`}>Navegação</h4>
               <nav className="flex flex-col gap-4 md:gap-5">
                 <button onClick={() => { setViewMode('home'); window.scrollTo({top:0, behavior:'smooth'}); }} className={`text-left text-sm md:text-base text-zinc-500 hover:${themeText} transition-colors uppercase font-black tracking-widest`}>Início</button>
                 <button onClick={() => scrollToSection(productSectionRef)} className={`text-left text-sm md:text-base text-zinc-500 hover:${themeText} transition-colors uppercase font-black tracking-widest`}>Produtos</button>
                 <button onClick={() => setActiveModal('how-it-works')} className={`text-left text-sm md:text-base text-zinc-500 hover:${themeText} transition-colors uppercase font-black tracking-widest`}>Protocolo Hub</button>
               </nav>
            </div>
            
            <div className="space-y-6 md:space-y-8">
               <h4 className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-glow`}>Canais</h4>
               <div className="space-y-6">
                 <p className="text-zinc-500 font-black text-sm md:text-base uppercase tracking-widest break-all">suporte@storehub.io</p>
                 <div className="flex gap-4 md:gap-5">
                   {[1,2,3].map(x => <div key={x} className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-lg ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-[#00ff88]/60' : 'bg-white border-zinc-200 hover:border-[#ff5e00]/60'}`}><div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-zinc-400"></div></div>)}
                 </div>
               </div>
            </div>
          </div>
          
          <div className="pt-8 md:pt-12 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 text-center md:text-left">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-zinc-400">© 2025 StoreHub Brilliant Ecosystem</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl transition-all duration-500" onClick={() => setActiveModal(null)}></div>
          <div className={`relative w-full ${getModalSizeClass()} p-0 rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden animate-slide-in border-4 transition-all duration-500 ${theme === 'dark' ? 'bg-[#000d0a] border-[#00ff88]/20 text-white' : 'bg-white border-orange-200 text-zinc-900'}`}>
            
            <button onClick={() => setActiveModal(null)} className={`absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 z-[110] transition-all bg-opacity-10 rounded-xl hover:scale-110 active:scale-90 border-2 ${theme === 'dark' ? 'text-[#00ff88] bg-[#00ff88] border-[#00ff88]/20' : 'text-[#ff5e00] bg-[#ff5e00] border-[#ff5e00]/20'}`}><Icons.Close className="w-5 h-5 md:w-6 md:h-6" /></button>
            
            <div className="max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-12 relative">
              {activeModal === 'login' && <LoginForm theme={theme} onLogin={(e:string, p:string) => {
                const u = registeredUsers.find(x => x.email === e && x.password === p);
                if(u) { setUser(u); setActiveModal(null); addToast(`Acesso concedido Hub!`, 'success'); }
                else addToast('Credenciais não auditadas', 'error');
              }} onGoToRegister={() => setActiveModal('register')} />}
              
              {activeModal === 'register' && <RegisterForm theme={theme} onRegister={(u:User) => {
                if(registeredUsers.find(x => x.email === u.email)) { addToast('Erro de Duplicidade Hub', 'error'); return; }
                setRegisteredUsers(prev => [...prev, u]);
                setUser(u);
                setActiveModal(null);
                addToast('Protocolo de Novo Membro Ativado!');
              }} onGoToLogin={() => setActiveModal('login')} />}

              {activeModal === 'profile' && user && <ProfileModal theme={theme} user={user} onUpdate={(u: any) => {
                setUser(u);
                setRegisteredUsers(prev => prev.map(x => x.id === u.id ? u : x));
                setActiveModal(null);
                addToast('Perfil Sincronizado');
              }} onLogout={() => {setUser(null); setActiveModal(null); addToast('Membro Offline');}} />}

              {activeModal === 'cart' && <CartModal theme={theme} cart={cart} setCart={setCart} onCheckout={() => {setCart([]); setActiveModal(null); addToast('Transação Processada!');}} />}
              
              {activeModal === 'productForm' && <ProductForm theme={theme} product={editingProduct} onSave={(p: any) => { 
                setProducts(prev => editingProduct ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
                setActiveModal(null);
                addToast('Hub Atualizado');
              }} />}
              
              {activeModal === 'chat' && <ChatModal theme={theme} products={products} />}
              {activeModal === 'how-it-works' && <HowItWorksView theme={theme} />}
              {activeModal === 'details' && selectedProduct && <ProductDetailsView theme={theme} product={selectedProduct} onAdd={() => {
                if(!user) { setActiveModal('login'); addToast('Sync Hub Requerido', 'error'); return; }
                setCart(prev => [...prev, {product: selectedProduct, quantity: 1}]);
                addToast('Alocado!');
                setActiveModal(null);
              }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Modals Components ---

const LoginForm = ({theme, onLogin, onGoToRegister}: any) => {
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const themeInput = theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-[#00ff88]/40 text-white' : 'bg-zinc-100 border-zinc-200 focus:border-[#ff5e00]/40 text-zinc-900';

  return (
    <div className="space-y-6 md:space-y-10 py-2 md:py-4 text-center animate-fade-in">
      <div className="space-y-2 md:space-y-3">
        <h3 className={`text-2xl md:text-5xl font-black font-grotesk tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Acesso <span className="text-glow">Hub</span></h3>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em]">Sincronize sua identidade neural StoreHub</p>
      </div>
      <div className="space-y-3 md:space-y-5 text-left max-w-sm mx-auto">
        <div className="space-y-1 md:space-y-2">
          <label className={`text-[9px] font-black uppercase tracking-[0.3em] ml-4 opacity-60 ${themeText}`}>Identidade / E-mail</label>
          <input placeholder="..." value={e} onChange={x => setE(x.target.value)} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] outline-none text-sm md:text-base border-2 font-bold transition-all ${themeInput}`} />
        </div>
        <div className="space-y-1 md:space-y-2">
          <label className={`text-[9px] font-black uppercase tracking-[0.3em] ml-4 opacity-60 ${themeText}`}>Chave Neural</label>
          <input type="password" placeholder="..." value={p} onChange={x => setP(x.target.value)} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] outline-none text-sm md:text-base border-2 font-bold transition-all ${themeInput}`} />
        </div>
      </div>
      <button onClick={() => onLogin(e, p)} className="w-full max-w-sm py-4 md:py-5 rounded-[2rem] btn-primary text-sm md:text-lg font-black uppercase tracking-[0.3em] shadow-lg transition-all shimmer">Sincronizar Acesso</button>
      <p className="text-[9px] uppercase font-black tracking-[0.3em] opacity-30">Perfil não auditado? <button onClick={onGoToRegister} className={`${themeText} hover:underline`}>Registrar Agora</button></p>
    </div>
  );
};

const RegisterForm = ({theme, onRegister, onGoToLogin}: any) => {
  const [n, setN] = useState('');
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const themeInput = theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-[#00ff88]/40 text-white' : 'bg-zinc-100 border-zinc-200 focus:border-[#ff5e00]/40 text-zinc-900';

  return (
    <div className="space-y-6 md:space-y-10 py-2 md:py-4 text-center animate-fade-in">
      <div className="space-y-2 md:space-y-3">
        <h3 className={`text-2xl md:text-5xl font-black font-grotesk tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Novo <span className="text-glow">Protocolo</span></h3>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em]">Inicie seu legado no ecossistema</p>
      </div>
      <div className="space-y-3 md:space-y-4 text-left max-w-sm mx-auto">
        <input placeholder="Pseudônimo Neural" value={n} onChange={x => setN(x.target.value)} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} />
        <input placeholder="E-mail Certificado" value={e} onChange={x => setE(x.target.value)} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} />
        <input type="password" placeholder="Criar Chave Neural" value={p} onChange={x => setP(x.target.value)} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} />
      </div>
      <button onClick={() => onRegister({id:Math.random().toString(), name:n, email:e, password:p, isAdmin:false})} className="w-full max-w-sm py-4 md:py-5 rounded-[2rem] btn-primary text-sm md:text-lg font-black uppercase tracking-[0.3em] shadow-lg transition-all shimmer">Ativar Perfil</button>
      <p className="text-[9px] uppercase font-black tracking-[0.3em] opacity-30">Membro antigo? <button onClick={onGoToLogin} className={`${themeText} hover:underline`}>Autenticar Sync</button></p>
    </div>
  );
};

const ProfileModal = ({theme, user, onUpdate, onLogout}: any) => {
  const [data, setData] = useState(user);
  const [showPassword, setShowPassword] = useState(false);
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const themeInput = theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-[#00ff88]/40 text-white' : 'bg-zinc-100 border-zinc-200 focus:border-[#ff5e00]/40 text-zinc-900';

  const handleFile = (e: any) => {
    if(!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => setData({...data, profilePhotoData: ev.target?.result, profilePhotoUrl:''});
    reader.readAsDataURL(e.target.files[0]);
  };

  return (
    <div className="space-y-8 md:space-y-12 text-center py-4 animate-fade-in">
      <h3 className={`text-2xl md:text-5xl font-black font-grotesk uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Perfil <span className="text-glow">Auditado</span></h3>
      
      {user.isAdmin && (
        <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${theme === 'dark' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff5e00]/10 text-[#ff5e00]'}`}>
          Acesso Administrador
        </div>
      )}

      <div className={`w-28 h-28 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden mx-auto border-4 relative group transition-all duration-1000 ${theme === 'dark' ? 'bg-[#001a14] border-[#00ff88]/40 shadow-[0_0_40px_rgba(0,255,136,0.3)]' : 'bg-white border-[#ff5e00]/40 shadow-[0_0_40px_rgba(255,94,0,0.3)]'}`}>
        {data.profilePhotoUrl || data.profilePhotoData ? (
          <img src={data.profilePhotoUrl || data.profilePhotoData} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        ) : (
          <div className={`text-5xl md:text-7xl font-black h-full flex items-center justify-center ${themeText}`}>{data.name[0]}</div>
        )}
        <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-700 backdrop-blur-md">
          <span className={`text-[9px] font-black ${themeText} uppercase tracking-[0.3em] px-4 text-center leading-tight`}>Alterar</span>
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <div className="space-y-4 md:space-y-6 text-left max-w-2xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
           <div className="space-y-2">
              <label className={`text-[9px] uppercase font-black opacity-50 tracking-[0.3em] ml-4 ${themeText}`}>Pseudônimo</label>
              <input value={data.name} onChange={x => setData({...data, name: x.target.value})} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} />
           </div>
           <div className="space-y-2">
              <label className={`text-[9px] uppercase font-black opacity-50 tracking-[0.3em] ml-4 ${themeText}`}>E-mail Hub</label>
              <input value={data.email} onChange={x => setData({...data, email: x.target.value})} className={`w-full px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} />
           </div>
         </div>
         
         <div className="space-y-2 relative">
            <label className={`text-[9px] uppercase font-black opacity-50 tracking-[0.3em] ml-4 ${themeText}`}>Chave Neural (Senha)</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={data.password || ''} 
                onChange={x => setData({...data, password: x.target.value})} 
                className={`w-full px-5 py-3 md:px-6 md:py-4 pr-12 rounded-[1.5rem] border-2 outline-none font-bold text-sm md:text-base transition-all ${themeInput}`} 
              />
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 opacity-50 hover:opacity-100 transition-opacity ${themeText}`}
              >
                {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
              </button>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto pt-6">
        <button onClick={() => onUpdate(data)} className="flex-1 py-4 md:py-5 rounded-[2rem] btn-primary font-black uppercase text-xs md:text-sm tracking-[0.3em] shadow-xl shimmer">Salvar</button>
        <button onClick={onLogout} className="px-8 md:px-12 py-4 md:py-5 rounded-[2rem] text-red-500 font-black uppercase text-xs md:text-sm tracking-[0.3em] border-2 border-red-500/20 hover:bg-red-500/10 transition-all">Sair</button>
      </div>
    </div>
  );
};

const CartModal = ({theme, cart, setCart, onCheckout}: any) => {
  const total = cart.reduce((a:any, b:any) => a + (b.product.price * b.quantity), 0);
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  
  return (
    <div className="space-y-8 md:space-y-12 py-2 animate-fade-in">
      <div className={`flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 pb-6 text-center md:text-left ${theme === 'dark' ? 'border-white/5' : 'border-zinc-100'}`}>
        <h3 className={`text-3xl md:text-6xl font-black flex flex-col md:flex-row items-center gap-4 uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Seu <span className="text-glow">Setup</span>
        </h3>
      </div>
      
      {cart.length === 0 ? (
        <div className="py-16 md:py-20 text-center space-y-6">
           <p className="opacity-10 font-black text-2xl md:text-6xl uppercase tracking-[0.3em] leading-tight">Hub Vazio</p>
           <button onClick={() => window.location.reload()} className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] hover:underline ${themeText}`}>Voltar ao Catálogo</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scroll">
            {cart.map((item:any, i:any) => (
              <div key={i} className={`flex items-center gap-4 md:gap-8 p-4 md:p-6 rounded-[2rem] border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-[#00ff88]/40' : 'bg-white border-zinc-200 hover:border-[#ff5e00]/40 shadow-sm'}`}>
                <div className="flex-1">
                  <h4 className={`font-black text-sm md:text-2xl uppercase tracking-tighter transition-colors line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{item.product.name}</h4>
                </div>
                <div className={`font-black text-base md:text-2xl text-glow`}>R$ {item.product.price.toFixed(2)}</div>
                <button onClick={() => setCart((prev:any) => prev.filter((_:any,idx:any)=>idx!==i))} className="text-red-500 font-black text-2xl md:text-4xl hover:rotate-90 hover:scale-125 transition-all p-2">×</button>
              </div>
            ))}
          </div>
          
          <div className={`flex flex-col md:flex-row justify-between items-center gap-8 border-t-2 pt-8 uppercase ${theme === 'dark' ? 'border-white/5' : 'border-zinc-100'}`}>
            <div className="flex flex-col text-center md:text-left">
              <span className="opacity-30 text-[10px] tracking-[0.5em] font-black mb-1">Investimento Total</span>
              <span className={`text-4xl md:text-6xl font-black font-grotesk leading-none text-glow`}>R$ {total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} className="w-full md:w-auto px-12 md:px-16 py-5 md:py-6 rounded-[2.5rem] btn-primary text-base md:text-xl font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all shimmer">
              Finalizar Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductDetailsView = ({theme, product, onAdd}: any) => {
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';

  return (
    <div className="animate-fade-in py-2">
      <div className={`relative aspect-[16/9] rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center overflow-hidden mb-6 md:mb-8 border-2 transition-all duration-1000 hover:scale-[1.01] ${theme === 'dark' ? 'bg-zinc-950 border-[#00ff88]/40 shadow-[0_0_60px_rgba(0,255,136,0.1)]' : 'bg-white border-[#ff5e00]/40 shadow-[0_0_60px_rgba(255,94,0,0.15)]'}`}>
        {product.customImageUrl || product.customImageData ? (
          <img src={product.customImageUrl || product.customImageData} className="w-full h-full object-cover" />
        ) : (
          <div className="scale-[3] opacity-20 animate-pulse-glow text-glow"><Icons.Logo className="w-12 h-12 md:w-16 md:h-16" /></div>
        )}
      </div>
      
      <div className="flex flex-col gap-4 md:gap-6 md:px-4">
        <h3 className={`text-2xl md:text-4xl font-black font-grotesk tracking-tighter uppercase leading-none break-words text-glow`}>{product.name}</h3>
        <p className={`opacity-70 font-medium text-xs md:text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {product.description || 'Ativo digital de alta performance auditado pela StoreHub Neural Network. Sync imediato e suporte garantido 24/7 para todos os membros certificados.'}
        </p>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 pb-6">
           <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] font-black opacity-30 uppercase tracking-[0.6em] mb-1">Investimento Dashboard</span>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl md:text-5xl font-black font-grotesk leading-none text-glow`}>R$ {product.price.toFixed(2)}</span>
                {product.originalPrice && product.originalPrice > product.price && <span className="text-sm md:text-base line-through opacity-50 font-bold">R$ {product.originalPrice.toFixed(2)}</span>}
              </div>
           </div>
           <button onClick={onAdd} className={`px-6 py-4 md:px-10 md:py-5 rounded-[2rem] btn-primary font-black uppercase text-xs md:text-base tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 shimmer`}>
             <Icons.Cart className="w-4 h-4 md:w-5 md:h-5" /> Sincronizar
           </button>
        </div>
      </div>
    </div>
  );
};

const ChatModal = ({theme, products}: any) => {
  const [m, setM] = useState('');
  const [h, setH] = useState<{r:'u'|'ai', t:string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [h]);

  const send = async () => {
    if(!m) return;
    const cur = m; setM(''); setH(p => [...p, {r:'u', t:cur}]);
    try {
      const res = await geminiService.getProductRecommendations(cur, products);
      setH(p => [...p, {r:'ai', t:res || 'IA Neural Offline.'}]);
    } catch { setH(p => [...p, {r:'ai', t:'Erro de Transmissão.'}]); }
  };
  return (
    <div className="h-[400px] md:h-[550px] flex flex-col py-4 animate-fade-in">
      <h3 className={`text-xl md:text-4xl font-black uppercase tracking-[0.3em] mb-6 md:mb-10 text-glow`}>IA Dashboard</h3>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 md:space-y-6 mb-6 md:mb-8 pr-4 custom-scroll">
        {h.map((x, i) => (
          <div key={i} className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] max-w-[90%] text-xs md:text-base font-semibold leading-relaxed border-2 ${x.r === 'u' ? (theme === 'dark' ? 'ml-auto bg-[#00ff88] text-[#002b1b] border-[#00ff88] shadow-lg' : 'ml-auto bg-[#ff5e00] text-white border-[#ff5e00] shadow-lg') : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900')}`}>{x.t}</div>
        ))}
      </div>
      <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto w-full group">
        <input placeholder="Fale com a IA..." value={m} onChange={x => setM(x.target.value)} onKeyDown={e => e.key==='Enter' && send()} className={`flex-1 px-5 py-3 md:px-8 md:py-5 rounded-[2.5rem] outline-none border-2 font-bold transition-all text-sm md:text-base ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00ff88]' : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:border-[#ff5e00]'}`} />
        <button onClick={send} className="px-6 md:px-10 rounded-[2.5rem] btn-primary font-black text-xl md:text-2xl group-hover:scale-105 transition-all">➔</button>
      </div>
    </div>
  );
};

const HowItWorksView = ({theme}: any) => {
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const themeBgAlpha = theme === 'dark' ? 'bg-[#00ff88]/20' : 'bg-[#ff5e00]/20';

  return (
    <div className="py-6 md:py-12 space-y-8 md:space-y-16 text-center">
      <h3 className={`text-2xl md:text-6xl font-black font-grotesk uppercase tracking-tighter text-glow`}>Protocolo Neural</h3>
      <div className="grid md:grid-cols-3 gap-4 md:gap-8">
        {['Sync Ativo', 'Pagar Blindado', 'Posse Instantânea'].map((s, i) => (
          <div key={i} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 md:border-4 transition-all duration-700 hover:scale-105 group ${theme === 'dark' ? 'border-white/5 bg-white/5 hover:border-[#00ff88]/40' : 'border-zinc-200 bg-zinc-50 hover:border-[#ff5e00]/40 shadow-sm'}`}>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1rem] ${themeBgAlpha} ${themeText} flex items-center justify-center font-black mb-4 md:mb-8 text-xl md:text-2xl shadow-lg mx-auto group-hover:animate-pulse-glow`}>{i+1}</div>
            <h4 className={`font-black uppercase text-base md:text-xl transition-colors ${theme === 'dark' ? 'text-white group-hover:text-[#00ff88]' : 'text-zinc-900 group-hover:text-[#ff5e00]'}`}>{s}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductForm = ({theme, product, onSave, onDelete}: any) => {
  const [d, setD] = useState(product || { 
    name:'', 
    seller:'StoreHub Official', 
    category:'games', 
    price:0, 
    originalPrice: 0,
    rating:5.0, 
    sales:0, 
    imageEmoji:'Gamepad', 
    description:'',
    customImageUrl: '',
    customImageData: '',
    outOfStock: false
  });
  
  const themeInput = theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#00ff88]' : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:border-[#ff5e00]';
  const themeText = theme === 'dark' ? 'text-[#00ff88]' : 'text-[#ff5e00]';
  const categories: CategoryType[] = ['games', 'accounts', 'skins', 'giftcards', 'services', 'discord', 'brawlhalla'];

  const handleImage = (e: any) => {
    if(!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => setD({...d, customImageData: ev.target?.result, customImageUrl: ''});
    reader.readAsDataURL(e.target.files[0]);
  };

  return (
    <div className="space-y-8 py-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h3 className={`text-2xl md:text-4xl font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{product ? 'Editar' : 'Criar'} <span className="text-glow">Ativo</span></h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={d.outOfStock} onChange={e => setD({...d, outOfStock: e.target.checked})} className="hidden peer" />
          <div className={`w-12 h-6 rounded-full border-2 transition-colors relative ${d.outOfStock ? 'bg-red-500 border-red-500' : (theme === 'dark' ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-200 border-zinc-300')}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${d.outOfStock ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${d.outOfStock ? 'text-red-500' : 'opacity-50'}`}>Fora de Estoque</span>
        </label>
      </div>
      
      {/* Image Upload */}
      <div className="flex justify-center mb-6">
        <label className={`w-full aspect-[2/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/5 overflow-hidden group relative ${theme === 'dark' ? 'border-white/20 hover:border-[#00ff88]' : 'border-zinc-300 hover:border-[#ff5e00]'}`}>
          {d.customImageData || d.customImageUrl ? (
            <img src={d.customImageData || d.customImageUrl} className={`w-full h-full object-cover ${d.outOfStock ? 'grayscale opacity-50' : ''}`} />
          ) : (
             <div className="flex flex-col items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
               <Icons.Upload className={`w-8 h-8 ${themeText}`} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Imagem</span>
             </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
             <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{d.customImageData ? 'Alterar Imagem' : 'Selecionar'}</span>
          </div>
          <input type="file" className="hidden" onChange={handleImage} accept="image/*" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Nome do Produto</label>
           <input placeholder="Ex: Conta Valorant" className={`w-full px-5 py-4 rounded-[1.5rem] border-2 outline-none text-sm font-bold ${themeInput}`} value={d.name} onChange={x => setD({...d, name: x.target.value})} />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Vendedor</label>
           <input placeholder="Ex: Loja Oficial" className={`w-full px-5 py-4 rounded-[1.5rem] border-2 outline-none text-sm font-bold ${themeInput}`} value={d.seller} onChange={x => setD({...d, seller: x.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Preço Atual (R$)</label>
           <input type="number" placeholder="0.00" className={`w-full px-5 py-4 rounded-[1.5rem] border-2 outline-none text-sm font-bold ${themeInput}`} value={d.price} onChange={x => setD({...d, price: parseFloat(x.target.value)})} />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Preço Antigo (R$)</label>
           <input type="number" placeholder="0.00" className={`w-full px-5 py-4 rounded-[1.5rem] border-2 outline-none text-sm font-bold ${themeInput}`} value={d.originalPrice || ''} onChange={x => setD({...d, originalPrice: parseFloat(x.target.value)})} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Categoria</label>
            <select className={`w-full px-5 py-4 rounded-[1.5rem] border-2 outline-none text-sm font-bold appearance-none ${themeInput}`} value={d.category} onChange={x => setD({...d, category: x.target.value})}>
              {categories.map(c => <option key={c} value={c} className="text-black">{c.toUpperCase()}</option>)}
            </select>
         </div>
         <div className="space-y-2">
            <div className="flex justify-between ml-3 mr-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Avaliação (0-5)</label>
              <span className={`text-xs font-black ${themeText}`}>{d.rating} ★</span>
            </div>
            <input type="range" min="0" max="5" step="0.1" value={d.rating} onChange={x => setD({...d, rating: parseFloat(x.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00ff88]" />
         </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-3">Descrição Detalhada</label>
        <textarea rows={5} placeholder="Descreva os detalhes do ativo..." className={`w-full px-5 py-4 rounded-[2rem] border-2 outline-none text-sm font-medium ${themeInput}`} value={d.description} onChange={x => setD({...d, description: x.target.value})} />
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <button onClick={() => onSave({...d, id: product?.id || Math.random().toString(), createdAt: new Date().toISOString()})} className="flex-1 py-5 md:py-6 rounded-[2rem] btn-primary font-black uppercase text-sm md:text-lg tracking-[0.3em] shadow-xl shimmer">
          {product ? 'Salvar Alterações' : 'Finalizar Registro'}
        </button>
      </div>
    </div>
  );
};

export default App;
