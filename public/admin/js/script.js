
    AOS.init();
    
    
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('hidden');
      document.getElementById('mainContent').classList.toggle('full-width');
    });

    // Ensure sidebar is always visible on desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('full-width');
      }
    });
    
 