const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const sidebarProfileNameEl = document.getElementById('sidebarProfileName');
const sidebarProfileRoleEl = document.getElementById('sidebarProfileRole');
const sidebarProfileImgEl = document.getElementById('sidebarProfileImg');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.closest('.menu-dropdown');
            dropdown.classList.toggle('active');
        });
    });

menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        const isDarkMode = body.classList.contains('dark-mode');
        
        icon.classList.toggle('fa-moon', !isDarkMode);
        icon.classList.toggle('fa-sun', isDarkMode);
        
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }


