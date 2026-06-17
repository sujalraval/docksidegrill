/* ==========================================================================
   Dockside Grill CMS - Admin Dashboard Controller Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. Session & Auth Security Checking
  // ==========================================
  const dbModeIndicator = document.getElementById('db-mode-indicator');
  const logoutBtn = document.getElementById('logout-btn');

  // Check auth depending on DB mode
  if (window.db && window.db.isCloud) {
    dbModeIndicator.innerHTML = '<i class="fa-solid fa-cloud"></i> Supabase Cloud';
    dbModeIndicator.style.backgroundColor = '#e8f8f5';
    dbModeIndicator.style.color = '#117a65';
    
    // Check cloud session
    const { data: { session } } = await window.db.client.auth.getSession();
    if (!session) {
      // Redirect to login page
      window.location.href = 'login.html';
      return;
    }
  } else {
    dbModeIndicator.innerHTML = '<i class="fa-solid fa-desktop"></i> LocalStorage Demo';
    dbModeIndicator.style.backgroundColor = '#ebf5fb';
    dbModeIndicator.style.color = '#2980b9';
    
    // Check local session
    if (sessionStorage.getItem('dg_admin_logged_in') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
  }

  // Handle Logout
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (window.db && window.db.isCloud) {
      await window.db.client.auth.signOut();
    } else {
      sessionStorage.removeItem('dg_admin_logged_in');
    }
    window.location.href = 'login.html';
  });

  // ==========================================
  // 2. Tab Navigation Switcher
  // ==========================================
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const pageTitle = document.getElementById('page-title');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const tabId = link.getAttribute('data-tab');
      
      // Update active links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Update active panels
      tabPanels.forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById(`tab-${tabId}`);
      if (activePanel) activePanel.classList.add('active');
      
      // Update page title
      const label = link.textContent.trim().split('\n')[0]; // Omit badge text
      pageTitle.innerText = label;
      
      // Fetch fresh data for selected panel
      loadTabData(tabId);
    });
  });

  // Load appropriate data when tab changes
  function loadTabData(tabId) {
    switch(tabId) {
      case 'overview':
        loadOverviewData();
        break;
      case 'menu-mgr':
        loadMenuManagerData();
        break;
      case 'reservations-mgr':
        loadReservationsManagerData();
        break;
      case 'reviews-mgr':
        loadReviewsManagerData();
        break;
    }
  }

  // ==========================================
  // 3. Overview Dashboard Tab Data
  // ==========================================
  async function loadOverviewData() {
    try {
      const items = await window.db.getMenuItems();
      const reservations = await window.db.getReservations();
      const allReviews = await window.db.getReviews(false); // get approved and pending
      
      const pendingReviews = allReviews.filter(r => !r.approved);
      
      // Update counter badges
      document.getElementById('badge-res-count').innerText = reservations.length;
      document.getElementById('badge-res-count').style.display = reservations.length > 0 ? 'inline-block' : 'none';
      
      document.getElementById('badge-rev-count').innerText = pendingReviews.length;
      document.getElementById('badge-rev-count').style.display = pendingReviews.length > 0 ? 'inline-block' : 'none';
      
      // Update stats numbers
      document.getElementById('stat-menu-count').innerText = items.length;
      document.getElementById('stat-res-count').innerText = reservations.length;
      document.getElementById('stat-rev-count').innerText = pendingReviews.length;
      
      // Load recent 5 bookings
      const recentBookingsList = document.getElementById('recent-bookings-list');
      recentBookingsList.innerHTML = '';
      
      const recentRes = reservations.slice(0, 5);
      if (recentRes.length === 0) {
        recentBookingsList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No reservations found.</td></tr>';
      } else {
        recentRes.forEach(r => {
          // Format date slightly shorter
          const d = new Date(r.date + 'T00:00:00');
          const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${r.guest_name}</strong></td>
            <td>${shortDate}</td>
            <td>${r.time}</td>
            <td><span class="status-pill status-active">${r.party_size}</span></td>
          `;
          recentBookingsList.appendChild(row);
        });
      }
      
      // Load recent pending reviews list
      const recentReviewsList = document.getElementById('recent-reviews-list');
      recentReviewsList.innerHTML = '';
      
      const pendingQueue = pendingReviews.slice(0, 3);
      if (pendingQueue.length === 0) {
        recentReviewsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px 0;">No reviews awaiting moderation.</div>';
      } else {
        pendingQueue.forEach(rev => {
          const card = document.createElement('div');
          card.className = 'review-item-compact';
          
          let starsHTML = '';
          for(let i=0; i<5; i++) {
            starsHTML += `<i class="${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star"></i> `;
          }
          
          card.innerHTML = `
            <div class="review-item-compact-header">
              <span class="review-item-author">${rev.author_name}</span>
              <span class="review-item-stars">${starsHTML}</span>
            </div>
            <p class="review-item-text">"${rev.review_text}"</p>
            <div class="review-item-actions">
              <button class="btn btn-icon btn-icon-success approve-btn" data-id="${rev.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
              <button class="btn btn-icon btn-icon-danger reject-btn" data-id="${rev.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          `;
          
          // Attach review action triggers
          card.querySelector('.approve-btn').addEventListener('click', () => handleApproveReview(rev.id));
          card.querySelector('.reject-btn').addEventListener('click', () => handleDeleteReview(rev.id));
          
          recentReviewsList.appendChild(card);
        });
      }
    } catch(err) {
      console.error("Error loading overview data:", err);
      showToast("Error loading statistics.", false);
    }
  }

  // ==========================================
  // 4. Menu Management Tab CRUD
  // ==========================================
  const menuModal = document.getElementById('menu-modal');
  const addMenuBtn = document.getElementById('add-menu-btn');
  const menuForm = document.getElementById('menu-item-form');
  const modalCloseBtn = menuModal.querySelector('.modal-close-btn');
  const modalCancelBtn = menuModal.querySelector('.modal-cancel');
  const menuModalTitle = document.getElementById('menu-modal-title');
  const imagePreview = document.getElementById('image-preview');
  const fileInput = document.getElementById('m-image-file');
  const fileTrigger = document.getElementById('file-trigger');
  const imageUrlInput = document.getElementById('m-image-url');

  // Trigger file selection manually
  fileTrigger.addEventListener('click', () => fileInput.click());

  // Handle image file selection & read as Base64 data url for Local Storage DB
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        imageUrlInput.value = evt.target.result; // Stores base64 string
        imagePreview.style.backgroundImage = `url('${evt.target.result}')`;
        imagePreview.innerHTML = ''; // Clear icon/label text
      };
      reader.readAsDataURL(file);
    }
  });

  // Modal open/close handles
  function openMenuModal(isEdit = false, itemData = null) {
    menuForm.reset();
    imageUrlInput.value = '';
    imagePreview.style.backgroundImage = 'none';
    imagePreview.innerHTML = '<i class="fa-regular fa-image"></i><span>No Image Selected</span>';
    
    if (isEdit && itemData) {
      menuModalTitle.innerText = "Edit Menu Item";
      document.getElementById('m-id').value = itemData.id;
      document.getElementById('m-title').value = itemData.title;
      document.getElementById('m-price').value = itemData.price;
      document.getElementById('m-category').value = itemData.category;
      document.getElementById('m-tags').value = itemData.tags ? itemData.tags.join(', ') : '';
      document.getElementById('m-desc').value = itemData.description;
      imageUrlInput.value = itemData.image_url || '';
      
      if (itemData.image_url) {
        imagePreview.style.backgroundImage = `url('${itemData.image_url}')`;
        imagePreview.innerHTML = '';
      }
    } else {
      menuModalTitle.innerText = "Add Menu Item";
      document.getElementById('m-id').value = '';
    }
    
    menuModal.classList.add('active');
  }

  function closeMenuModal() {
    menuModal.classList.remove('active');
  }

  if (addMenuBtn) addMenuBtn.addEventListener('click', () => openMenuModal(false));
  modalCloseBtn.addEventListener('click', closeMenuModal);
  modalCancelBtn.addEventListener('click', closeMenuModal);
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeMenuModal();
  });

  // Form submit handler for saving dish
  menuForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('m-id').value;
    const title = document.getElementById('m-title').value.trim();
    const price = parseFloat(document.getElementById('m-price').value);
    const category = document.getElementById('m-category').value;
    const desc = document.getElementById('m-desc').value.trim();
    const tagsString = document.getElementById('m-tags').value;
    
    // Parse tags to array
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t !== '') : [];
    
    // Default image if none uploaded
    let finalImageUrl = imageUrlInput.value || './unnamed-2.jpg';
    
    // Cloud storage upload handler if connected to Supabase
    if (window.db && window.db.isCloud && fileInput.files[0]) {
      const file = fileInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;
      
      try {
        // Upload to bucket
        let { error: uploadError } = await window.db.client.storage
          .from('dockside-grill-assets')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        
        // Retrieve public url
        const { data: { publicUrl } } = window.db.client.storage
          .from('dockside-grill-assets')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      } catch (err) {
        console.error("Cloud image upload failed:", err);
        showToast("Image upload failed. Storing metadata with placeholder.", false);
      }
    }
    
    const itemData = {
      title: title,
      price: price,
      category: category,
      description: desc,
      tags: tags,
      image_url: finalImageUrl
    };
    
    if (id) {
      itemData.id = id;
    }
    
    try {
      await window.db.saveMenuItem(itemData);
      showToast(id ? "Menu item updated successfully!" : "Menu item added successfully!");
      closeMenuModal();
      loadMenuManagerData();
    } catch(err) {
      console.error(err);
      showToast("Error saving menu item.", false);
    }
  });

  // Fetch and render Menu Items in table
  async function loadMenuManagerData() {
    const tableBody = document.getElementById('menu-items-table');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading menu items...</td></tr>';
    
    try {
      const items = await window.db.getMenuItems();
      tableBody.innerHTML = '';
      
      if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No menu items found. Click "Add New Item" to create one.</td></tr>';
        return;
      }
      
      items.forEach(item => {
        const row = document.createElement('tr');
        
        // Tags badges
        let tagsHTML = '';
        if (item.tags && item.tags.length > 0) {
          item.tags.forEach(t => {
            tagsHTML += `<span class="status-pill status-active" style="font-size: 0.75rem; margin-right: 5px; padding: 2px 6px;">${t}</span>`;
          });
        }
        
        row.innerHTML = `
          <td><img src="${item.image_url || '../unnamed-2.jpg'}" class="table-img" alt="${item.title}"></td>
          <td><strong>${item.title}</strong><div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</div></td>
          <td style="text-transform: capitalize;">${item.category}</td>
          <td><strong>$${parseFloat(item.price).toFixed(2)}</strong></td>
          <td>${tagsHTML || '<span style="color:var(--text-muted);">-</span>'}</td>
          <td>
            <div class="btn-action-row">
              <button class="btn-icon edit-btn" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="btn-icon btn-icon-danger delete-btn" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </td>
        `;
        
        // Bind button actions
        row.querySelector('.edit-btn').addEventListener('click', () => openMenuModal(true, item));
        row.querySelector('.delete-btn').addEventListener('click', () => handleDeleteMenu(item.id, item.title));
        
        tableBody.appendChild(row);
      });
    } catch(err) {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 30px;">Error loading menu database.</td></tr>';
    }
  }

  async function handleDeleteMenu(id, title) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await window.db.deleteMenuItem(id);
        showToast("Dish deleted successfully!");
        loadMenuManagerData();
      } catch (err) {
        console.error(err);
        showToast("Error deleting item.", false);
      }
    }
  }

  // ==========================================
  // 5. Reservations Tab Controller
  // ==========================================
  const ticketModal = document.getElementById('ticket-modal');
  const ticketCloseBtn = ticketModal.querySelector('.modal-close-btn');
  const ticketModalBody = document.getElementById('ticket-modal-body');

  ticketCloseBtn.addEventListener('click', () => ticketModal.classList.remove('active'));
  ticketModal.addEventListener('click', (e) => {
    if (e.target === ticketModal) ticketModal.classList.remove('active');
  });

  async function loadReservationsManagerData() {
    const tableBody = document.getElementById('reservations-table');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Loading reservations...</td></tr>';
    
    try {
      const reservations = await window.db.getReservations();
      tableBody.innerHTML = '';
      
      if (reservations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No online reservations recorded yet.</td></tr>';
        return;
      }
      
      reservations.forEach(r => {
        const row = document.createElement('tr');
        
        // Format Date
        const dObj = new Date(r.date + 'T00:00:00');
        const formattedDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        row.innerHTML = `
          <td><code style="font-weight:700; color:var(--primary-light);">${r.code}</code></td>
          <td><strong>${r.guest_name}</strong></td>
          <td><div>${formattedDate}</div><div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${r.time}</div></td>
          <td><span class="status-pill status-active">${r.party_size}</span></td>
          <td><span style="font-size:0.85rem;">${r.seating_preference}</span></td>
          <td><div style="font-size:0.85rem;">${r.email}</div><div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${r.phone}</div></td>
          <td>
            <div class="btn-action-row">
              <button class="btn-icon view-ticket-btn" title="View Boarding Pass"><i class="fa-solid fa-passport"></i></button>
            </div>
          </td>
        `;
        
        row.querySelector('.view-ticket-btn').addEventListener('click', () => openTicketPassModal(r));
        tableBody.appendChild(row);
      });
    } catch(err) {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 30px;">Error loading reservations database.</td></tr>';
    }
  }

  // Opens booking ticket in modal
  function openTicketPassModal(res) {
    const dObj = new Date(res.date + 'T00:00:00');
    const formattedDate = dObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    ticketModalBody.innerHTML = `
      <div class="ticket-wrapper" style="margin-top: 15px;">
        <div class="ticket">
          <div class="ticket-header" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); padding: 20px; text-align: center; color: #fff; border-top-left-radius:12px; border-top-right-radius:12px;">
            <span class="ticket-logo" style="font-weight: bold; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;">Dockside Grill</span>
            <h2 style="font-size: 1.8rem; font-family: 'Playfair Display', serif; margin-top: 5px;">BOARDING PASS</h2>
            <div style="font-size: 0.75rem; text-transform: uppercase; margin-top: 5px;">West End Marina, Bahamas</div>
          </div>
          
          <div class="ticket-body" style="padding: 25px; background:#fff; border-bottom-left-radius:12px; border-bottom-right-radius:12px; border:1px solid #ddd; border-top:none;">
            <div class="ticket-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">GUEST NAME</div>
                <div class="ticket-value" style="font-weight: 700; font-size: 1rem; color: #2c3e50;">${res.guest_name}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">CONFIRMATION</div>
                <div class="ticket-value-highlight" style="font-weight: 700; color: var(--secondary); font-size: 1.2rem;">${res.code}</div>
              </div>
              
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">DATE</div>
                <div class="ticket-value" style="font-weight: 700; font-size: 1rem; color: #2c3e50;">${formattedDate}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">DINING TIME</div>
                <div class="ticket-value" style="font-weight: 700; font-size: 1rem; color: #2c3e50;">${res.time}</div>
              </div>
              
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">PARTY SIZE</div>
                <div class="ticket-value" style="font-weight: 700; font-size: 1rem; color: #2c3e50;">${res.party_size}</div>
              </div>
              <div class="ticket-info-item">
                <div class="ticket-label" style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">TABLE AREA</div>
                <div class="ticket-value" style="font-weight: 700; font-size: 1rem; color: #2c3e50;">${res.seating_preference}</div>
              </div>
            </div>
            
            <div class="ticket-divider" style="height: 1px; border-top: 2px dashed #ddd; margin: 20px 0;"></div>
            
            <div style="font-size: 0.8rem; color: #7f8c8d; text-align: center; margin-bottom: 15px;">
              Contact Details: <strong>${res.phone}</strong> | <strong>${res.email}</strong>
              ${res.notes ? `<div style="margin-top:5px; font-style:italic;">"${res.notes}"</div>` : ''}
            </div>
            
            <div class="ticket-barcode-container" style="display: flex; flex-direction: column; align-items: center; margin-top: 15px;">
              <div class="ticket-barcode" style="width: 80%; height: 50px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px, #000 6px, #000 8px); margin-bottom: 8px;"></div>
              <div class="ticket-code" style="font-size: 0.8rem; letter-spacing: 5px; font-weight: 700;">${res.code}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-top: 25px;">
        <button class="btn btn-outline" style="flex: 1;" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Boarding Pass</button>
        <button class="btn btn-primary" style="flex: 1;" id="close-view-ticket-btn">Close</button>
      </div>
    `;
    
    document.getElementById('close-view-ticket-btn').addEventListener('click', () => ticketModal.classList.remove('active'));
    ticketModal.classList.add('active');
  }

  // ==========================================
  // 6. Reviews Moderation Tab CRUD
  // ==========================================
  async function loadReviewsManagerData() {
    const tableBody = document.getElementById('reviews-table');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Loading reviews queue...</td></tr>';
    
    try {
      const allReviews = await window.db.getReviews(false);
      const pending = allReviews.filter(r => !r.approved);
      
      tableBody.innerHTML = '';
      
      // Update sidebar counts too
      document.getElementById('badge-rev-count').innerText = pending.length;
      document.getElementById('badge-rev-count').style.display = pending.length > 0 ? 'inline-block' : 'none';
      
      if (pending.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No pending reviews awaiting moderation. All reviews are active.</td></tr>';
        return;
      }
      
      pending.forEach(rev => {
        const row = document.createElement('tr');
        
        let starsHTML = '';
        for(let i=0; i<5; i++) {
          starsHTML += `<i class="${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star" style="color:var(--warning)"></i> `;
        }
        
        row.innerHTML = `
          <td><strong>${rev.author_name}</strong></td>
          <td>${starsHTML}</td>
          <td><div style="max-width:400px; font-style:italic; font-size:0.9rem;">"${rev.review_text}"</div></td>
          <td>
            <div class="btn-action-row">
              <button class="btn-icon btn-icon-success approve-row-btn" title="Approve Review"><i class="fa-solid fa-check"></i></button>
              <button class="btn-icon btn-icon-danger delete-row-btn" title="Delete Review"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </td>
        `;
        
        row.querySelector('.approve-row-btn').addEventListener('click', () => handleApproveReview(rev.id));
        row.querySelector('.delete-row-btn').addEventListener('click', () => handleDeleteReview(rev.id));
        
        tableBody.appendChild(row);
      });
    } catch(err) {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 30px;">Error loading reviews database.</td></tr>';
    }
  }

  async function handleApproveReview(id) {
    try {
      await window.db.approveReview(id);
      showToast("Review approved and added to site slider!");
      
      // Reload active tab data
      const activeLink = document.querySelector('.sidebar-link.active');
      if (activeLink) loadTabData(activeLink.getAttribute('data-tab'));
    } catch (err) {
      console.error(err);
      showToast("Error approving review.", false);
    }
  }

  async function handleDeleteReview(id) {
    if (confirm("Are you sure you want to permanently delete/reject this review?")) {
      try {
        await window.db.deleteReview(id);
        showToast("Review deleted successfully.");
        
        // Reload active tab data
        const activeLink = document.querySelector('.sidebar-link.active');
        if (activeLink) loadTabData(activeLink.getAttribute('data-tab'));
      } catch (err) {
        console.error(err);
        showToast("Error deleting review.", false);
      }
    }
  }

  // ==========================================
  // 7. Toast Alerts Helpers
  // ==========================================
  const toast = document.getElementById('admin-toast');
  const toastMsg = document.getElementById('admin-toast-message');

  function showToast(message, isSuccess = true) {
    toastMsg.innerText = message;
    toast.className = 'alert-toast active';
    if (!isSuccess) {
      toast.style.backgroundColor = 'var(--danger)';
      toast.querySelector('i').className = 'fa-solid fa-circle-exclamation';
    } else {
      toast.style.backgroundColor = '#2ecc71';
      toast.querySelector('i').className = 'fa-solid fa-circle-check';
    }
    
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  }

  // ==========================================
  // 8. Page Init Load
  // ==========================================
  loadOverviewData();

});
