import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';
import './css/Navbar.css';
import SearchSuggestBox from './components/SearchSuggestBox';
import UserNotificationBell from './components/UserNotificationBell';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [stickySearch, setStickySearch] = useState('');
  const [showNavSuggest, setShowNavSuggest] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const megaRef = useRef(null);
  const isHomePage = location.pathname === '/';

  // Show sticky search bar: always on inner pages, or after scrolling on homepage
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showStickySearchBar = !isHomePage || scrolled;


// ========== Data ==========
const [provinces, setProvinces] = useState([]);

useEffect(() => {
  const fetchProvinces = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/provinces/popular');
      const data = await res.json();
      if (data.success) {
        setProvinces(data.data.map((p) => p.name));
      }
    } catch (err) {
      console.error('Failed to fetch provinces:', err);
      setProvinces(['กรุงเทพฯ', 'ชลบุรี', 'เชียงใหม่', 'ภูเก็ต']);
    }
  };
  fetchProvinces();
}, []);


  const propertyTypes = [
    { icon: 'fa-building', label: 'คอนโดมิเนียม', slug: 'condo' },
    { icon: 'fa-home', label: 'บ้านเดี่ยว', slug: 'house' },
    { icon: 'fa-th-large', label: 'ทาวน์เฮ้าส์', slug: 'townhouse' },
    { icon: 'fa-map', label: 'ที่ดิน', slug: 'land' },
    { icon: 'fa-store', label: 'อาคารพาณิชย์', slug: 'commercial' },
    { icon: 'fa-warehouse', label: 'โกดัง/โรงงาน', slug: 'warehouse' },
  ];

  const moreItems = [
    { icon: 'fa-question-circle', label: 'คำถามที่พบบ่อย', link: '/faq' },
    { icon: 'fa-phone-alt', label: 'ติดต่อเรา', link: '/contact' },
  ];

  // ========== Auth ==========
  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) setUser(JSON.parse(userData));
      else setUser(null);
    } catch { setUser(null); }
  };

  // ========== Click outside ==========
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (megaRef.current && !megaRef.current.contains(e.target)) setActiveMega(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveMega(null);
    setMobileSubmenu(null);
    setIsOpen(false);
  }, [location]);

  // ========== Actions ==========
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    setIsOpen(false);
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const closeAll = () => {
    setIsOpen(false);
    setShowDropdown(false);
    setActiveMega(null);
    setMobileSubmenu(null);
  };



  // ========== Sub-Components ==========

  const MegaDropdown = ({ listingType, label, icon }) => {
    const [searchQ, setSearchQ] = React.useState('');
    return (
    <div className="mega-dropdown">
      <div className="mega-dropdown-header">
        <h6><i className={`fas ${icon} me-2`}></i>ค้นหาอสังหาฯ{label === 'ซื้อ' ? 'เพื่อซื้อ' : 'เพื่อเช่า'}</h6>
      </div>
      <div className="mega-dropdown-body">
        <div style={{ flex: 1 }}>
          <div className="mega-section-title">
            <i className="fas fa-map-marker-alt me-1"></i> ทำเล
          </div>
          <div className="mega-grid">
            {provinces.map((p, i) => (
              <Link key={`mega-${i}-${p}`} to={`/search?listing_type=${listingType}&province=${encodeURIComponent(p)}`}
                className="mega-grid-link" onClick={closeAll}>{p}</Link>
            ))}
            <Link to={`/search?listing_type=${listingType}`}
              className="mega-grid-link view-all" onClick={closeAll}>ดูทั้งหมด →</Link>
          </div>
        </div>
        <div className="mega-dropdown-divider"></div>
        <div style={{ flex: 1 }}>
          <div className="mega-section-title">
            <i className="fas fa-th-list me-1"></i> ประเภทอสังหาฯ
          </div>
          <div className="mega-grid">
            {propertyTypes.map((t) => (
              <Link key={t.slug} to={`/search?listing_type=${listingType}&property_type=${t.slug}`}
                className="mega-type-link" onClick={closeAll}>
                <i className={`fas ${t.icon}`}></i> {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mega-dropdown-footer">
        <div className="d-flex gap-2">
          <input type="text"
            placeholder={`ค้นหาอสังหาฯ ${label === 'ซื้อ' ? 'ซื้อ' : 'เช่า'} ... เช่น คอนโด สุขุมวิท`}
            className="form-control form-control-sm mega-search-input"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { navigate(`/search?listing_type=${listingType}&search=${encodeURIComponent(e.target.value)}`); closeAll(); }
            }} />
          <button className="btn btn-sm mega-search-btn"
            onClick={() => { navigate(`/search?listing_type=${listingType}${searchQ ? `&search=${encodeURIComponent(searchQ)}` : ''}`); closeAll(); }}>
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>
    </div>
    );
  };

  const MoreDropdown = () => (
    <div className="more-dropdown">
      {moreItems.map((item, i) => (
        <Link key={i} to={item.link} className="more-dropdown-item" onClick={closeAll}>
          <i className={`fas ${item.icon}`}></i>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );

  const UserMenu = ({ isMobile }) => (
    <div ref={!isMobile ? dropdownRef : null} style={{ position: 'relative' }}>
      <button
        className={`btn d-flex align-items-center gap-2 rounded-pill px-3 py-1 user-btn ${isMobile ? 'mobile' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-avatar">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="text-start">
          <div className="user-name">{user?.username || 'User'}</div>
        </div>
        <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} chevron`}></i>
      </button>

      {showDropdown && (
        <div className={`user-dropdown ${isMobile ? 'mobile' : 'desktop'}`}>
          {/* Header */}
          <div className="user-dropdown-header">
            <div className="name">{user?.username}</div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {[
              { to: '/profile',       icon: 'fa-user-circle',   label: 'โปรไฟล์' },
              { to: '/saved',         icon: 'fa-heart',         label: 'ทรัพย์ที่บันทึก' },
              ...(user?.role === 'admin' ? [
                { to: '/list-property', icon: 'fa-plus-circle', label: 'เพิ่มทรัพย์ใหม่' },
                { to: '/dashboard',   icon: 'fa-tachometer-alt', label: 'แดชบอร์ด' },
                { to: '/admin',       icon: 'fa-cog',           label: 'จัดการระบบ' },
              ] : []),
            ].map((item, i) => (
              <Link key={i} to={item.to} className="user-dropdown-link" onClick={closeAll}>
                <i className={`fas ${item.icon}`} style={{ color: item.icon === 'fa-cog' ? '#D32F2F' : 'var(--brand-green)' }}></i>
                {item.label}
              </Link>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 0' }}>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ========== RENDER ==========
  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm fixed-top py-0 loandd-navbar">
      <div className="container" ref={megaRef}>

        <Link className="navbar-brand d-flex align-items-center me-0 me-lg-3 py-2" to="/" onClick={closeAll}>
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm navbar-brand-logo">
            <img src={bigLogo} alt="บ้าน D มีเชง" />
          </div>
          <span className="ms-2 fw-bold text-white d-none d-sm-inline navbar-brand-text">บ้าน D มีเชง</span>
        </Link>

        {/* มือถือ: bell + avatar + hamburger (ขวา) */}
        <div className="d-flex align-items-center order-lg-2 ms-auto d-lg-none gap-2">
          {user && <UserNotificationBell />}
          {!user ? (
            <Link to="/login" className="btn btn-sm btn-outline-light rounded-pill fw-bold d-flex align-items-center mobile-login-btn">
              <i className="fas fa-user me-1"></i> เข้าสู่ระบบ
            </Link>
          ) : (
            <Link to="/profile" className="mob-avatar-link" onClick={closeAll}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Link>
          )}
          <button
            className="mob-hamburger"
            onClick={() => { setIsOpen(!isOpen); setMobileSubmenu(null); }}
            aria-label="เปิดเมนู"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* ===== Desktop Mega Nav ===== */}
        <div className="d-none d-lg-flex align-items-center flex-grow-1">
          <div className="d-flex align-items-center gap-1 ms-2">
            <Link to="/" className="mega-nav-link text-decoration-none" onClick={closeAll}>
              <i className="fas fa-home menu-icon"></i> หน้าแรก
            </Link>
            {[
              { key: 'buy',  label: 'ซื้อ', listingType: 'sale', icon: 'fa-shopping-cart' },
              { key: 'rent', label: 'เช่า', listingType: 'rent', icon: 'fa-key' },
            ].map(({ key, label, listingType, icon }) => (
              <div key={key} style={{ position: 'relative' }}>
                <button className={`mega-nav-link ${activeMega === key ? 'active-mega' : ''}`}
                  onClick={() => setActiveMega(activeMega === key ? null : key)}>
                  <i className={`fas ${icon} menu-icon`}></i> {label}
                  <i className={`fas fa-chevron-${activeMega === key ? 'up' : 'down'} chevron`}></i>
                </button>
                {activeMega === key && <MegaDropdown listingType={listingType} label={label} icon={icon} />}
              </div>
            ))}
            <Link to="/guide" className="mega-nav-link text-decoration-none" onClick={closeAll}>
              <i className="fas fa-book menu-icon"></i> คู่มือ
            </Link>
            <div style={{ position: 'relative' }}>
              <button className={`mega-nav-link ${activeMega === 'more' ? 'active-mega' : ''}`}
                onClick={() => setActiveMega(activeMega === 'more' ? null : 'more')}>
                <i className="fas fa-ellipsis-h menu-icon"></i> เพิ่มเติม
                <i className={`fas fa-chevron-${activeMega === 'more' ? 'up' : 'down'} chevron`}></i>
              </button>
              {activeMega === 'more' && <MoreDropdown />}
            </div>
          </div>

          {/* ===== STICKY SEARCH BAR (desktop) ===== */}
          <div style={{
            flex: 1, maxWidth: 340, margin: '0 12px',
            opacity: showStickySearchBar ? 1 : 0,
            transform: showStickySearchBar ? 'translateY(0) scaleX(1)' : 'translateY(-4px) scaleX(0.95)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: showStickySearchBar ? 'auto' : 'none',
            position: 'relative',
          }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                const q = stickySearch.trim();
                navigate(q ? `/search?search=${encodeURIComponent(q)}&page=1` : '/search?page=1');
                setStickySearch('');
                setShowNavSuggest(false);
                closeAll();
              }}
              style={{
                display: 'flex', alignItems: 'center',
                background: '#fff',
                borderRadius: 50, padding: '4px 4px 4px 16px',
                border: showNavSuggest ? '2px solid #04AA6D' : '2px solid transparent',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'border-color 0.15s',
              }}
            >
              <i className="fas fa-search" style={{ color: '#aaa', fontSize: '0.85rem', marginRight: 8 }} />
              <input
                type="text"
                value={stickySearch}
                onChange={e => setStickySearch(e.target.value)}
                onFocus={() => setShowNavSuggest(true)}
                onBlur={() => setTimeout(() => setShowNavSuggest(false), 150)}
                placeholder="ค้นหา ทรัพย์ ทำเล สถานี..."
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  color: '#1a2d4a', fontSize: '0.85rem', fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              {stickySearch && (
                <button type="button" onClick={() => setStickySearch('')}
                  style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0 6px', fontSize: '0.8rem' }}>
                  <i className="fas fa-times" />
                </button>
              )}
              <button type="submit"
                style={{
                  background: '#04AA6D', color: '#fff', border: 'none',
                  borderRadius: 50, width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                }}>
                <i className="fas fa-arrow-right" />
              </button>
            </form>

            {/* Suggestion dropdown */}
            <SearchSuggestBox
              visible={showNavSuggest}
              inputValue={stickySearch}
              onSelect={val => setStickySearch(val)}
              onClose={() => setShowNavSuggest(false)}
            />
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            {user?.role === 'admin' && (
              <Link to="/list-property" className="btn fw-bold px-3 rounded-pill nav-list-property-btn" onClick={closeAll}>
                <i className="fas fa-plus-circle me-1"></i> เพิ่มทรัพย์
              </Link>
            )}

            {user && <UserNotificationBell />}

            {user ? (
              <UserMenu isMobile={false} />
            ) : (
              <>
                <Link to="/login" className="btn fw-bold px-3 rounded-pill auth-login-btn">เข้าสู่ระบบ</Link>
                <Link to="/register" className="btn fw-bold px-3 rounded-pill shadow auth-register-btn" onClick={closeAll}>สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ===== Mobile Drawer (new design — slide from right) ===== */}
      {/* Backdrop */}
      <div
        className={`mob-backdrop ${isOpen ? 'mob-backdrop--on' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className={`mob-drawer ${isOpen ? 'mob-drawer--open' : ''}`}>

        {/* ── Green Header ── */}
        <div className="mob-head">
          <button className="mob-close" onClick={() => setIsOpen(false)} aria-label="ปิดเมนู">
            <i className="fas fa-times" />
          </button>
          {user ? (
            <div className="mob-head-user">
              <div className="mob-head-avatar">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div className="mob-head-name">{user.username}</div>
                <div className="mob-head-role">สมาชิก บ้าน D มีเชง</div>
              </div>
            </div>
          ) : (
            <div className="mob-head-brand">
              <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 38, height: 38, flexShrink: 0 }}>
                <img src={bigLogo} alt="บ้าน D มีเชง" style={{ height: 28 }} />
              </div>
              <span>บ้าน D มีเชง</span>
            </div>
          )}
        </div>

        {/* ── Search Bar ── */}
        <form className="mob-search" onSubmit={e => {
          e.preventDefault();
          if (stickySearch.trim()) {
            navigate(`/search?search=${encodeURIComponent(stickySearch.trim())}`);
            setStickySearch('');
            closeAll();
          }
        }}>
          <div className="mob-search-inner">
            <i className="fas fa-search" />
            <input
              type="text"
              value={stickySearch}
              onChange={e => setStickySearch(e.target.value)}
              placeholder="ค้นหาทรัพย์สิน..."
            />
          </div>
          <button type="submit" className="mob-search-btn">ค้นหา</button>
        </form>

        {/* ── Navigation Items ── */}
        <div className="mob-nav">
          <Link to="/" className="mob-nav-item" onClick={closeAll}>
            <div className="mob-nav-icon mob-icon-home"><i className="fas fa-home" /></div>
            <span>หน้าแรก</span>
          </Link>

          {[
            { key: 'buy',  label: 'ซื้อ',  icon: 'fa-shopping-cart', listingType: 'sale', cls: 'mob-icon-buy' },
            { key: 'rent', label: 'เช่า',  icon: 'fa-key',           listingType: 'rent', cls: 'mob-icon-rent' },
          ].map(({ key, label, icon, listingType, cls }) => (
            <div key={key}>
              <div
                className={`mob-nav-item ${mobileSubmenu === key ? 'mob-nav-item--active' : ''}`}
                onClick={() => setMobileSubmenu(mobileSubmenu === key ? null : key)}
              >
                <div className={`mob-nav-icon ${cls}`}><i className={`fas ${icon}`} /></div>
                <span>{label}</span>
                <i className={`fas fa-chevron-${mobileSubmenu === key ? 'up' : 'down'} mob-chevron`} />
              </div>

              {mobileSubmenu === key && (
                <div className="mob-submenu">
                  <div className="mob-sub-label">ทำเล</div>
                  <div className="mob-sub-grid">
                    {provinces.slice(0, 8).map((p, i) => (
                      <Link key={i} to={`/search?listing_type=${listingType}&province=${encodeURIComponent(p)}`}
                        className="mob-sub-chip" onClick={closeAll}>{p}</Link>
                    ))}
                  </div>
                  <Link to={`/search?listing_type=${listingType}`} className="mob-sub-all" onClick={closeAll}>
                    ดูทั้งหมด →
                  </Link>
                  <div className="mob-sub-label">ประเภท</div>
                  <div className="mob-type-list">
                    {propertyTypes.map(t => (
                      <Link key={t.slug} to={`/search?listing_type=${listingType}&property_type=${t.slug}`}
                        className="mob-type-item" onClick={closeAll}>
                        <i className={`fas ${t.icon}`} /> {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link to="/guide" className="mob-nav-item" onClick={closeAll}>
            <div className="mob-nav-icon mob-icon-guide"><i className="fas fa-book" /></div>
            <span>คู่มือซื้อขาย</span>
          </Link>

          {moreItems.map((item, i) => (
            <Link key={i} to={item.link} className="mob-nav-item" onClick={closeAll}>
              <div className="mob-nav-icon mob-icon-more"><i className={`fas ${item.icon}`} /></div>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Bottom: Auth / User links ── */}
        <div className="mob-bottom">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/list-property" className="mob-add-btn" onClick={closeAll}>
                  <i className="fas fa-plus-circle" /> เพิ่มทรัพย์ใหม่
                </Link>
              )}
              <div className="mob-user-links">
                <Link to="/profile" className="mob-user-link" onClick={closeAll}>
                  <i className="fas fa-user-circle" /> โปรไฟล์
                </Link>
                <Link to="/saved" className="mob-user-link" onClick={closeAll}>
                  <i className="fas fa-heart" /> ทรัพย์ที่บันทึก
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link to="/dashboard" className="mob-user-link" onClick={closeAll}>
                      <i className="fas fa-tachometer-alt" /> แดชบอร์ด
                    </Link>
                    <Link to="/admin" className="mob-user-link mob-user-link--admin" onClick={closeAll}>
                      <i className="fas fa-cog" /> จัดการระบบ
                    </Link>
                  </>
                )}
              </div>
              <button className="mob-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> ออกจากระบบ
              </button>
            </>
          ) : (
            <div className="mob-auth-btns">
              <Link to="/login" className="mob-auth-login" onClick={closeAll}>เข้าสู่ระบบ</Link>
              <Link to="/register" className="mob-auth-register" onClick={closeAll}>สมัครสมาชิก</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;