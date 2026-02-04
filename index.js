       const body = document.getElementById('body');
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const closeSidebar = document.getElementById('closeSidebar');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const darkModeToggle = document.getElementById('darkModeToggle');
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
            // Dropdown functionality
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.parentElement;
            dropdown.classList.toggle('active');
        });
    });
        // Sidebar Toggle
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            mobileOverlay.classList.add('active');
            body.style.overflow = 'hidden';
        });

        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
            body.style.overflow = 'auto';
        });

        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
            body.style.overflow = 'auto';
        });

        // Dark Mode Toggle
        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            
            if (body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                localStorage.setItem('darkMode', 'disabled');
            }
        });

        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
            darkModeToggle.querySelector('i').classList.remove('fa-moon');
            darkModeToggle.querySelector('i').classList.add('fa-sun');
        }
// =========================
// 3D Tilt Effect
// =========================
const tiltCard = document.getElementById('tiltCard');
const tiltContainer = document.querySelector('.tilt-container');

if (tiltCard && tiltContainer) {
    tiltContainer.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 15;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 15;
        tiltCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    tiltContainer.addEventListener('mouseleave', () => {
        tiltCard.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
}

// =========================
// Stats Counter Animation
// =========================
function animateCounter(el, start, end, duration) {
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        let value = Math.floor(progress * (end - start) + start);

        if (end >= 1000) {
            el.innerText = Math.floor(value / 1000) + "K+";
        } else {
            el.innerText = value + (end === 100 ? "%" : "");
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.innerText = end >= 1000 ? (end / 1000) + "K+" : end + (end === 100 ? "%" : "");
        }
    }

    requestAnimationFrame(step);
}

// =========================
// Scroll Reveal + Counter
// =========================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');

            entry.target.querySelectorAll('.stat-num').forEach(counter => {
                if (counter.innerText === "0") {
                    animateCounter(
                        counter,
                        0,
                        +counter.dataset.target,
                        2000
                    );
                }
            });
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .stats-section')
    .forEach(el => revealObserver.observe(el));

// =========================
// FAQ Accordion (Correct)
// =========================
document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
        const item = q.parentElement;
        const isActive = item.classList.contains('active');

        // Rufe duk FAQs
        document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
        });

        // Idan bai kasance open ba, bude shi
        if (!isActive) {
            item.classList.add('active');
        }
    });
});
 

// =========================
// Smooth Scroll (Global)
// =========================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// =========================
// Active Link on Scroll
// =========================
window.addEventListener('scroll', () => {
    let currentSection = "";

    document.querySelectorAll('section[id]').forEach(section => {
        if (pageYOffset >= section.offsetTop - 200) {
            currentSection = section.id;
        }
    });

    document.querySelectorAll('.nav-link, .menu-item').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
});

// =========================
// Hero Floating Effect
// =========================
let lastScroll = window.scrollY;

window.addEventListener('scroll', () => {
    const heroCard = document.querySelector('.hero-visual .dashboard-card');
    if (!heroCard) return;

    const diff = window.scrollY - lastScroll;
    heroCard.style.transform = `translateY(${diff * 0.4}px)`;
    lastScroll = window.scrollY;
});


const scrollToTopBtn = document.getElementById('scrollToTop');
            
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.classList.add('active');
                } else {
                    scrollToTopBtn.classList.remove('active');
                }
            });
            
            scrollToTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

 // Scroll animation for elements
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            