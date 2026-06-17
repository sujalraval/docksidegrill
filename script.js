/* ==========================================================================
   Dockside Grill - Interactive JavaScript Functionality
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // Theme Toggle (Dark / Light Mode)
  // ==========================================
  const themeSwitchBtn = document.getElementById('theme-switch');
  const bodyElement = document.body;
  const themeIcon = themeSwitchBtn.querySelector('i');
  
  // Check local storage for preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  bodyElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeSwitchBtn.addEventListener('click', () => {
    const currentTheme = bodyElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    bodyElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#ff7a39';
    } else {
      themeIcon.className = 'fa-solid fa-moon';
      themeIcon.style.color = '';
    }
  }

  // ==========================================
  // Header Style Scroll Adjustment
  // ==========================================
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ==========================================
  // Mobile Hamburger Navigation Menu
  // ==========================================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
  
  // Close menu when clicking link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // ==========================================
  // Active Navigation Link on Scroll
  // ==========================================
  const sections = document.querySelectorAll('section');
  
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-50% 0px -50% 0px' // Trigger when section occupies center of viewport
  });
  
  sections.forEach(section => scrollObserver.observe(section));

  // ==========================================
  // About Section Animations on Scroll
  // ==========================================
  const aboutContent = document.getElementById('about-content');
  const aboutGallery = document.getElementById('about-gallery');
  
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
      }
    });
  }, { threshold: 0.15 });
  
  if (aboutContent) aboutObserver.observe(aboutContent);
  if (aboutGallery) aboutObserver.observe(aboutGallery);

  // ==========================================
  // Interactive Menu Filters
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const menuCards = document.querySelectorAll('.menu-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active class on buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      
      menuCards.forEach(card => {
        // Simple card grid filtering with animation scale
        card.style.transform = 'scale(0.8)';
        card.style.opacity = '0';
        
        setTimeout(() => {
          if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.transform = 'scale(1)';
              card.style.opacity = '1';
            }, 50);
          } else {
            card.style.display = 'none';
          }
        }, 300);
      });
    });
  });

  // ==========================================
  // Reviews slider/carousel logic
  // ==========================================
  const sliderWrapper = document.getElementById('reviews-wrapper');
  const slides = document.querySelectorAll('.review-slide');
  const prevBtn = document.getElementById('prev-review-btn');
  const nextBtn = document.getElementById('next-review-btn');
  const dotsContainer = document.getElementById('slider-dots');
  
  let currentSlideIndex = 0;
  const slideCount = slides.length;
  let autoplayTimer;
  
  // Build indicator dots dynamically
  slides.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoplay();
    });
    dotsContainer.appendChild(dot);
  });
  
  const dots = document.querySelectorAll('.dot');
  
  function goToSlide(index) {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    
    currentSlideIndex = index;
    sliderWrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    
    // Update active dot styling
    dots.forEach((dot, idx) => {
      dot.className = `dot ${idx === currentSlideIndex ? 'active' : ''}`;
    });
  }
  
  function nextSlide() {
    goToSlide(currentSlideIndex + 1);
  }
  
  function prevSlide() {
    goToSlide(currentSlideIndex - 1);
  }
  
  // Attach listeners
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
  
  // Autoplay
  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, 5000);
  }
  
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  
  startAutoplay();

  // ==========================================
  // Leaflet Interactive Map Setup
  // ==========================================
  // Dockside Grill, Bayshore Rd, West End, Bahamas
  // Coordinates for West End marina area: 26.6872, -78.9772
  const mapCenter = [26.6872, -78.9772];
  
  try {
    const map = L.map('map', {
      scrollWheelZoom: false
    }).setView(mapCenter, 15);
    
    // Beautiful clean map tiles (CartoDB Positron theme fits light/dark layout)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    // Custom Icon for Marina Grill
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="background-color: #0a5f70; color: #fff; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"><i class="fa-solid fa-anchor"></i></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    const markerPopupText = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 5px;">
        <h4 style="font-family: 'Playfair Display', serif; font-size: 1.15rem; margin-bottom: 5px; color: #0a5f70;">Dockside Grill</h4>
        <p style="margin: 0; font-size: 0.85rem; color: #5e6e78;">P225+49X, Bayshore Rd<br>West End, Bahamas</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 0.85rem; color: #ff7a39;"><i class="fa-solid fa-phone"></i> +1 242-602-5173</p>
      </div>
    `;
    
    L.marker(mapCenter, { icon: customIcon })
      .addTo(map)
      .bindPopup(markerPopupText)
      .openPopup();
  } catch (error) {
    console.error('Leaflet Map Error: ', error);
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
  const toast = document.getElementById('alert-toast');
  const toastMsg = document.getElementById('alert-message');
  
  function showToast(message, isSuccess = true) {
    toastMsg.innerText = message;
    toast.className = `alert-toast active`;
    if (!isSuccess) {
      toast.style.backgroundColor = '#e74c3c';
    } else {
      toast.style.backgroundColor = '#2ecc71';
    }
    
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  }

  // ==========================================
  // Forms Handlers
  // ==========================================
  
  // Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input').value;
      showToast(`Thank you! ${email} has been subscribed.`);
      newsletterForm.reset();
    });
  }
  
  // Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('c-name').value;
      showToast(`Thank you, ${name}! Your message was sent successfully.`);
      contactForm.reset();
    });
  }

  // ==========================================
  // Reservation Modal & Ticket Generation
  // ==========================================
  const modalOverlay = document.getElementById('booking-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const bookNavBtn = document.getElementById('nav-book-btn');
  const bookHeroBtn = document.getElementById('hero-book-btn');
  const bookingForm = document.getElementById('booking-form');
  const modalBodyContent = document.getElementById('modal-body-content');
  const modalHeader = modalOverlay.querySelector('.modal-header');
  
  // Store default reservation form markup to reset when opening again
  const initialModalContent = modalBodyContent.innerHTML;
  const initialHeaderContent = modalHeader.innerHTML;
  
  // Open Modal
  function openBookingModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set default date input value to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('b-date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Rebind form handlers in case it was reset
    rebindBookingForm();
  }
  
  // Close Modal
  function closeBookingModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset modal content back to booking form after transition completes
    setTimeout(() => {
      modalBodyContent.innerHTML = initialModalContent;
      modalHeader.innerHTML = initialHeaderContent;
      rebindBookingForm();
    }, 400);
  }
  
  // Event listeners for opening
  if (bookNavBtn) bookNavBtn.addEventListener('click', openBookingModal);
  if (bookHeroBtn) bookHeroBtn.addEventListener('click', openBookingModal);
  
  // Event listeners for closing
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBookingModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeBookingModal();
  });
  
  // Function to re-bind submit event on booking form
  function rebindBookingForm() {
    const currentForm = document.getElementById('booking-form');
    if (currentForm) {
      currentForm.addEventListener('submit', handleBookingSubmit);
    }
  }
  
  // Generate Boarding Pass / Ticket on submission
  function handleBookingSubmit(e) {
    e.preventDefault();
    
    // Retrieve values
    const dateVal = document.getElementById('b-date').value;
    const timeVal = document.getElementById('b-time').value;
    const guestsVal = document.getElementById('b-guests').value;
    const seatingVal = document.getElementById('b-seating').value;
    const nameVal = document.getElementById('b-name').value;
    const emailVal = document.getElementById('b-email').value;
    const phoneVal = document.getElementById('b-phone').value;
    
    // Format Date nicely
    const dateObj = new Date(dateVal + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate Random Confirmation Code
    const codePrefix = 'DG';
    const codeNum = Math.floor(100000 + Math.random() * 900000);
    const confirmationCode = `${codePrefix}-${codeNum}`;
    
    // Change modal title and description to boarding pass
    modalHeader.innerHTML = `
      <h2 class="modal-title" style="color: var(--accent);"><i class="fa-solid fa-circle-check"></i> Booking Confirmed!</h2>
      <p class="modal-subtitle">Your boarding pass for culinary experience is ready</p>
    `;
    
    // Replace form with luxurious Ticket ticket
    modalBodyContent.innerHTML = `
      <div class="ticket-wrapper">
        <div class="ticket">
          <div class="ticket-header">
            <span class="ticket-logo">Dockside Grill</span>
            <h2>BOARDING PASS</h2>
            <div style="font-size: 0.75rem; text-transform: uppercase; margin-top: 5px;">West End Marina, Bahamas</div>
          </div>
          
          <div class="ticket-body">
            <div class="ticket-info-grid">
              <div class="ticket-info-item">
                <div class="ticket-label">GUEST NAME</div>
                <div class="ticket-value">${nameVal}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label">CONFIRMATION</div>
                <div class="ticket-value-highlight">${confirmationCode}</div>
              </div>
              
              <div class="ticket-info-item">
                <div class="ticket-label">DATE</div>
                <div class="ticket-value">${formattedDate}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label">DINING TIME</div>
                <div class="ticket-value">${timeVal}</div>
              </div>
              
              <div class="ticket-info-item">
                <div class="ticket-label">PARTY SIZE</div>
                <div class="ticket-value">${guestsVal}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label">TABLE AREA</div>
                <div class="ticket-value">${seatingVal}</div>
              </div>
            </div>
            
            <div class="ticket-divider"></div>
            
            <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-bottom: 15px;">
              <i class="fa-solid fa-circle-info"></i> Present this ticket or code upon arrival. A confirmation email has been sent to <strong>${emailVal}</strong>.
            </div>
            
            <div class="ticket-barcode-container">
              <div class="ticket-barcode"></div>
              <div class="ticket-code">${confirmationCode}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-top: 25px;">
        <button class="btn btn-outline" style="flex: 1;" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Ticket</button>
        <button class="btn btn-primary" style="flex: 1;" id="ticket-close-btn">Done</button>
      </div>
    `;
    
    // Add event listener for close button on the ticket screen
    document.getElementById('ticket-close-btn').addEventListener('click', closeBookingModal);
    
    // Play sound or success toast
    showToast(`Booking Successful! ID: ${confirmationCode}`);
  }

  // Initial form bind
  rebindBookingForm();

});
