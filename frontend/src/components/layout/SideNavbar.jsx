import {
  Home,
  MessageCircle,
  UserPlus,
  Image,
  Bot,
  Images,
  Shuffle,
  Crown,
  User,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './SideNavbar.css';

const SideNavbar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Recent Chats', path: '/chats' },
    // { icon: UserPlus, label: 'Create Character', path: '/create' },
    // { icon: Image, label: 'Generate Image', path: '/generate' },
    // { icon: Bot, label: 'My AI', path: '/my-ai' },
    // { icon: Images, label: 'My Gallery', path: '/gallery' },
    // { icon: Shuffle, label: 'FaceSwap', path: '/faceswap', badge: 'AD' },
  ];

  const bottomItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <aside className="side-navbar">
      <nav className="side-nav-menu">
        <ul className="menu-list">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
                <ChevronRight size={16} className="chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="side-nav-bottom">
        <button className="premium-btn">
          <Crown size={20} />
          <span>Become Premium</span>
        </button>

        <ul className="menu-list bottom-menu">
          {bottomItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SideNavbar;
