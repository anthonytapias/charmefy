import TopNavbar from './TopNavbar';
import SideNavbar from './SideNavbar';
import './BaseLayout.css';

const BaseLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <TopNavbar />
      <SideNavbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default BaseLayout;
