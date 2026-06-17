/* ==========================================================================
   Dockside Grill - Dynamic Interactive Functionality
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Theme Toggle (Dark / Light Mode)
  // ==========================================
  const themeSwitchBtn = document.getElementById('theme-switch');
  const bodyElement = document.body;
  const themeIcon = themeSwitchBtn.querySelector('i');
  
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
  // 2. Header Style Scroll Adjustment
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
  // 3. Mobile Hamburger Navigation Menu
  // ==========================================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
  
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // ==========================================
  // 4. Active Navigation Link on Scroll
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
    rootMargin: '-50% 0px -50% 0px'
  });
  
  sections.forEach(section => scrollObserver.observe(section));

  // ==========================================
  // 5. About Section Animations on Scroll
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
  // 6. Dynamic Content Loader (Supabase / Local Fallback)
  // ==========================================
  
  // A. Load and Render Menu Items
  async function initMenu() {
    const gridContainer = document.getElementById('menu-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Fetching dishes from the galley...</div>';
    
    try {
      const items = await window.db.getMenuItems();
      gridContainer.innerHTML = '';
      
      if (items.length === 0) {
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No dishes on the menu today.</div>';
        return;
      }
      
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.setAttribute('data-category', item.category);
        
        // Tags rendering
        let tagsHTML = '';
        if (item.tags && item.tags.length > 0) {
          item.tags.forEach(t => {
            tagsHTML += `<span class="menu-tag">${t}</span>`;
          });
        }
        
        // Check if there is any popular badge
        const badgeHTML = item.tags && item.tags.includes('Popular') ? '<span class="menu-badge">Popular</span>' : 
                          item.tags && item.tags.includes('Best Seller') ? '<span class="menu-badge">Best Seller</span>' : '';

        card.innerHTML = `
          <div class="menu-card-img">
            ${badgeHTML}
            <img src="${item.image_url}" alt="${item.title}" onerror="this.src='./unnamed-2.jpg'">
          </div>
          <div class="menu-card-body">
            <div class="menu-card-title-price">
              <h3 class="menu-card-title">${item.title}</h3>
              <span class="menu-card-price">$${parseFloat(item.price).toFixed(2)}</span>
            </div>
            <p class="menu-card-text">${item.description}</p>
            <div class="menu-card-footer">
              <div class="menu-tags">
                ${tagsHTML}
              </div>
            </div>
          </div>
        `;
        gridContainer.appendChild(card);
      });
      
      // Re-trigger category filters hook since elements are now in the DOM
      setupMenuFilters();
    } catch (err) {
      console.error("Menu init error:", err);
      gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">Failed to load menu. Check connection.</div>';
    }
  }

  // Set up filters click handlers
  function setupMenuFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card');
    
    filterBtns.forEach(btn => {
      btn.replaceWith(btn.cloneNode(true)); // Clear previous listeners
    });
    
    const newFilterBtns = document.querySelectorAll('.filter-btn');
    newFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        newFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        const cards = document.querySelectorAll('.menu-card');
        
        cards.forEach(card => {
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
  }

  // B. Load and Render Approved Reviews
  async function initReviews() {
    const wrapper = document.getElementById('reviews-wrapper');
    const dotsContainer = document.getElementById('slider-dots');
    if (!wrapper) return;
    
    try {
      const approvedReviews = await window.db.getReviews(true);
      wrapper.innerHTML = '';
      dotsContainer.innerHTML = '';
      
      if (approvedReviews.length === 0) {
        wrapper.innerHTML = '<div class="review-slide" style="text-align:center;">No reviews yet. Be the first to submit a review!</div>';
        return;
      }
      
      approvedReviews.forEach(rev => {
        const slide = document.createElement('div');
        slide.className = 'review-slide';
        
        // Stars rendering
        let starsHTML = '';
        for(let i=0; i<5; i++) {
          starsHTML += `<i class="${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i> `;
        }
        
        // Initial letter avatar
        const initials = rev.author_initials || rev.author_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        slide.innerHTML = `
          <div class="review-stars">
            ${starsHTML}
          </div>
          <p class="review-text">
            "${rev.review_text}"
          </p>
          <div class="review-author">
            <div class="author-avatar">${initials}</div>
            <div class="author-info">
              <h4 class="author-info-name">${rev.author_name}</h4>
              <p class="author-info-title">Guest Reviewer</p>
            </div>
          </div>
        `;
        wrapper.appendChild(slide);
      });
      
      // Initialize reviews slider navigation loops
      setupReviewsSlider();
    } catch(err) {
      console.error("Reviews load error:", err);
      wrapper.innerHTML = '<div class="review-slide" style="text-align:center;">Error loading reviews.</div>';
    }
  }

  // Reviews Slider Controller
  function setupReviewsSlider() {
    const sliderWrapper = document.getElementById('reviews-wrapper');
    const slides = document.querySelectorAll('.review-slide');
    const prevBtn = document.getElementById('prev-review-btn');
    const nextBtn = document.getElementById('next-review-btn');
    const dotsContainer = document.getElementById('slider-dots');
    
    let currentSlideIndex = 0;
    const slideCount = slides.length;
    let autoplayTimer;
    
    dotsContainer.innerHTML = '';
    
    // Create navigation dots
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
    
    // Bind buttons
    if (nextBtn) {
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      document.getElementById('next-review-btn').addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    }
    if (prevBtn) {
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      document.getElementById('prev-review-btn').addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    }
    
    function startAutoplay() {
      autoplayTimer = setInterval(nextSlide, 5000);
    }
    
    function resetAutoplay() {
      clearInterval(autoplayTimer);
      startAutoplay();
    }
    
    startAutoplay();
  }

  // ==========================================
  // 7. Leaflet Interactive Map Setup
  // ==========================================
  const mapCenter = [26.6872, -78.9772];
  
  try {
    const map = L.map('map', {
      scrollWheelZoom: false
    }).setView(mapCenter, 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
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
  // 8. Toast Notifications
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
  // 9. Forms Handlers (Contact & Newsletter)
  // ==========================================
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input').value;
      showToast(`Thank you! ${email} has been subscribed.`);
      newsletterForm.reset();
    });
  }
  
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
  // 10. Table Booking Reservation Wizard & DB Submit
  // ==========================================
  const modalOverlay = document.getElementById('booking-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const bookNavBtn = document.getElementById('nav-book-btn');
  const bookHeroBtn = document.getElementById('hero-book-btn');
  const bookingForm = document.getElementById('booking-form');
  const modalBodyContent = document.getElementById('modal-body-content');
  const modalHeader = modalOverlay.querySelector('.modal-header');
  
  const initialModalContent = modalBodyContent.innerHTML;
  const initialHeaderContent = modalHeader.innerHTML;
  
  function openBookingModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('b-date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    rebindBookingForm();
  }
  
  function closeBookingModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      modalBodyContent.innerHTML = initialModalContent;
      modalHeader.innerHTML = initialHeaderContent;
      rebindBookingForm();
    }, 400);
  }
  
  if (bookNavBtn) bookNavBtn.addEventListener('click', openBookingModal);
  if (bookHeroBtn) bookHeroBtn.addEventListener('click', openBookingModal);
  modalCloseBtn.addEventListener('click', closeBookingModal);
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeBookingModal();
  });
  
  function rebindBookingForm() {
    const currentForm = document.getElementById('booking-form');
    if (currentForm) {
      currentForm.addEventListener('submit', handleBookingSubmit);
    }
  }
  
  async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const dateVal = document.getElementById('b-date').value;
    const timeVal = document.getElementById('b-time').value;
    const guestsVal = document.getElementById('b-guests').value;
    const seatingVal = document.getElementById('b-seating').value;
    const nameVal = document.getElementById('b-name').value.trim();
    const emailVal = document.getElementById('b-email').value.trim();
    const phoneVal = document.getElementById('b-phone').value.trim();
    const notesVal = document.getElementById('b-notes').value.trim();
    
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
    
    const reservationData = {
      guest_name: nameVal,
      email: emailVal,
      phone: phoneVal,
      date: dateVal,
      time: timeVal,
      party_size: guestsVal,
      seating_preference: seatingVal,
      notes: notesVal,
      code: confirmationCode
    };

    try {
      // POST Booking to database manager
      await window.db.addReservation(reservationData);
      
      // Update UI title to Booking Success Card
      modalHeader.innerHTML = `
        <h2 class="modal-title" style="color: var(--accent);"><i class="fa-solid fa-circle-check"></i> Booking Confirmed!</h2>
        <p class="modal-subtitle">Your boarding pass for culinary experience is ready</p>
      `;
      
      // Replace Form content with custom ticket pass rendering
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
                <i class="fa-solid fa-circle-info"></i> Present this boarding pass upon arrival. A confirmation email was sent to <strong>${emailVal}</strong>.
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
      
      document.getElementById('ticket-close-btn').addEventListener('click', closeBookingModal);
      showToast(`Booking Successful! Code: ${confirmationCode}`);
    } catch (err) {
      console.error(err);
      showToast("Reservation failed. Try again.", false);
    }
  }

  // ==========================================
  // 11. Custom Review Submission Modal & Post
  // ==========================================
  const writeReviewBtn = document.getElementById('write-review-btn');
  const reviewModalOverlay = document.getElementById('review-modal-overlay');
  const reviewModalCloseBtn = document.getElementById('review-modal-close-btn');
  const reviewForm = document.getElementById('review-form');
  
  if (writeReviewBtn) {
    writeReviewBtn.addEventListener('click', () => {
      reviewForm.reset();
      reviewModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  function closeReviewModal() {
    reviewModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (reviewModalCloseBtn) reviewModalCloseBtn.addEventListener('click', closeReviewModal);
  if (reviewModalOverlay) {
    reviewModalOverlay.addEventListener('click', (e) => {
      if (e.target === reviewModalOverlay) closeReviewModal();
    });
  }
  
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const author = document.getElementById('r-name').value.trim();
      const rating = parseInt(document.getElementById('r-rating').value);
      const text = document.getElementById('r-text').value.trim();
      
      const initials = author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      
      const reviewData = {
        author_name: author,
        author_initials: initials,
        rating: rating,
        review_text: text
      };
      
      try {
        await window.db.addReview(reviewData);
        showToast("Review submitted! It will appear on site once approved by the admin.");
        closeReviewModal();
      } catch (err) {
        console.error(err);
        showToast("Error submitting review. Please try again.", false);
      }
    });
  }

  // ==========================================
  // 12. Run Initialization on Page Load
  // ==========================================
  initMenu();
  initReviews();
  rebindBookingForm();

});
