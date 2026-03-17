/**
 * Cambodian National ID Card Management System
 * ប្រព័ន្ធគ្រប់គ្រងអត្តសញ្ញាណបណ្ណសញ្ជាតិខ្មែរ
 * 
 * Frontend JavaScript Application
 */

// ============================================
// THEME MANAGEMENT
// ============================================

/**
 * Initialize theme on page load
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme icon
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = '/api';
const PROVINCE_API_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_66a8603700604c000123e144/json?page=1&page_size=30';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('error');
    }
    toast.classList.add('active');
    toastMessage.textContent = message;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get initials from name
 */
function getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

/**
 * Fetch provinces from MEF API
 */
async function fetchProvinces() {
    try {
        const response = await fetch(PROVINCE_API_URL);
        const data = await response.json();
        
        if (data && data.items) {
            // Sort provinces by name (Khmer)
            return data.items.sort((a, b) => a.province_kh.localeCompare(b.province_kh, 'km'));
        }
        return [];
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return [];
    }
}

/**
 * Populate province dropdowns
 */
async function populateProvinceDropdowns() {
    const provinces = await fetchProvinces();
    const pobSelect = document.getElementById('pob_province');
    const currentSelect = document.getElementById('current_province');
    
    if (provinces.length === 0) {
        pobSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្នន័យបាន</option>';
        currentSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្នន័យបាន</option>';
        return;
    }
    
    const options = provinces.map(p => `<option value="${p.province_kh}">${p.province_kh} (${p.province_en})</option>`).join('');
    
    const defaultOption = '<option value="">ជ្រើសរើសខេត្ត/រាជធានី</option>';
    pobSelect.innerHTML = defaultOption + options;
    currentSelect.innerHTML = defaultOption + options;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch all ID cards
 */
async function fetchAllCards() {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching cards:', error);
        showToast('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ', 'error');
        return [];
    }
}

/**
 * Search ID cards
 */
async function searchCards(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error searching cards:', error);
        showToast('មានបញ្ហាក្នុងការស្វែងរក', 'error');
        return [];
    }
}

/**
 * Create new ID card
 */
async function createCard(cardData) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('ចុះឈ្មោះជោគជ័យ!');
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error creating card:', error);
        showToast(error.message || 'មានបញ្ហាក្នុងការចុះឈ្មោះ', 'error');
        return null;
    }
}

/**
 * Update ID card
 */
async function updateCard(cardId, cardData) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('កែប្រែព័ត៌មានជោគជ័យ!');
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error updating card:', error);
        showToast(error.message || 'មានបញ្ហាក្នុងការកែប្រែ', 'error');
        return null;
    }
}

/**
 * Delete ID card
 */
async function deleteCard(cardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards/${cardId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('លុបព័ត៌មានជោគជ័យ!');
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error deleting card:', error);
        showToast(error.message || 'មានបញ្ហាក្នុងការលុប', 'error');
        return false;
    }
}

/**
 * Get statistics
 */
async function fetchStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return { total: 0, male: 0, female: 0 };
    }
}

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Update statistics display
 */
async function updateStatistics() {
    const stats = await fetchStatistics();
    
    document.getElementById('total-count').textContent = stats.total;
    document.getElementById('male-count').textContent = stats.male;
    document.getElementById('female-count').textContent = stats.female;
}

/**
 * Render cards table
 */
function renderCardsTable(cards) {
    const tbody = document.getElementById('cards-tbody');
    const emptyState = document.getElementById('empty-state');
    const resultCount = document.getElementById('result-count');
    
    tbody.innerHTML = '';
    resultCount.textContent = `${cards.length} នាក់`;
    
    if (cards.length === 0) {
        emptyState.style.display = 'block';
        document.querySelector('.table-container').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
    
    cards.forEach((card, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="photo-cell">
                ${card.photo_url 
                    ? `<img src="${card.photo_url}" alt="${card.khmer_name}" onerror="this.parentElement.innerHTML='<div class=\\'no-photo\\'><i class=\\'fas fa-user\\'></i></div>'">`
                    : `<div class="no-photo"><i class="fas fa-user"></i></div>`
                }
            </td>
            <td><strong>${card.id_number}</strong></td>
            <td>${card.khmer_name}</td>
            <td>${card.latin_name}</td>
            <td>
                <span class="badge ${card.gender === 'ប្រុស' ? 'male' : 'female'}">
                    ${card.gender}
                </span>
            </td>
            <td>${formatDate(card.date_of_birth)}</td>
            <td>${card.place_of_birth}</td>
            <td class="actions">
                <button class="btn btn-info btn-sm" onclick="viewCard(${card.id})" title="មើល">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-success btn-sm" onclick="editCard(${card.id})" title="កែប្រែ">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${card.id})" title="លុប">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Load all cards
 */
async function loadAllCards() {
    document.getElementById('search-input').value = '';
    const cards = await fetchAllCards();
    renderCardsTable(cards);
}

/**
 * Search ID cards
 */
async function searchIDCards() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
        loadAllCards();
        return;
    }
    
    const cards = await searchCards(query);
    renderCardsTable(cards);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Show add modal
 */
function showAddModal() {
    document.getElementById('card-form').reset();
    document.getElementById('card-id').value = '';
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-id-card"></i> ចុះឈ្មោះថ្មី';
    document.getElementById('nationality').value = 'ខ្មែរ';
    document.getElementById('card-modal').classList.add('active');
}

/**
 * Show edit modal
 */
async function editCard(cardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards/${cardId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const card = data.data;
        
        document.getElementById('card-id').value = card.id;
        document.getElementById('id_number').value = card.id_number;
        document.getElementById('khmer_name').value = card.khmer_name;
        document.getElementById('latin_name').value = card.latin_name;
        document.getElementById('date_of_birth').value = card.date_of_birth;
        document.getElementById('gender').value = card.gender;
        document.getElementById('nationality').value = card.nationality;
        document.getElementById('place_of_birth').value = card.place_of_birth;
        document.getElementById('current_address').value = card.current_address;
        
        // Handle dropdowns (if the value exists in the options)
        if (card.place_of_birth_province) document.getElementById('pob_province').value = card.place_of_birth_province;
        if (card.current_address_province) document.getElementById('current_province').value = card.current_address_province;

        document.getElementById('father_name').value = card.father_name;
        document.getElementById('mother_name').value = card.mother_name;
        document.getElementById('issue_date').value = card.issue_date;
        document.getElementById('expiry_date').value = card.expiry_date;
        document.getElementById('photo_url').value = card.photo_url || '';
        
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> កែប្រែព័ត៌មាន';
        document.getElementById('card-modal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading card:', error);
        showToast('មានបញ្ហាក្នុងការទាញយកព័ត៌មាន', 'error');
    }
}

/**
 * View card details
 */
async function viewCard(cardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/id-cards/${cardId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const card = data.data;
        const viewBody = document.getElementById('view-modal-body');
        
        viewBody.innerHTML = `
            <div class="detail-card">
                <div class="detail-photo">
                    ${card.photo_url 
                        ? `<img src="${card.photo_url}" alt="${card.khmer_name}" onerror="this.parentElement.innerHTML='<div class=\\'no-photo\\'><i class=\\'fas fa-user\\'></i></div>'">`
                        : `<div class="no-photo"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <div class="detail-info">
                    <h3>${card.khmer_name}</h3>
                    <p class="latin-name">${card.latin_name}</p>
                    <p><i class="fas fa-id-card"></i> ${card.id_number}</p>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>ភេទ</label>
                    <span>${card.gender}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃខែឆ្នាំកំណើត</label>
                    <span>${formatDate(card.date_of_birth)}</span>
                </div>
                <div class="detail-item">
                    <label>សញ្ជាតិ</label>
                    <span>${card.nationality}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃចុះបញ្ជី</label>
                    <span>${formatDate(card.issue_date)}</span>
                </div>
                <div class="detail-item full-width">
                    <label>ទីកន្លែងកំណើត</label>
                    <span>${card.place_of_birth}${card.place_of_birth_province ? `, ${card.place_of_birth_province}` : ''}</span>
                </div>
                <div class="detail-item full-width">
                    <label>អាសយដ្ឋានបច្ចុប្បន្ន</label>
                    <span>${card.current_address}${card.current_address_province ? `, ${card.current_address_province}` : ''}</span>
                </div>
                <div class="detail-item">
                    <label>ឈ្មោះឪពុក</label>
                    <span>${card.father_name}</span>
                </div>
                <div class="detail-item">
                    <label>ឈ្មោះម្តាយ</label>
                    <span>${card.mother_name}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃផុតកំណត់</label>
                    <span>${formatDate(card.expiry_date)}</span>
                </div>
                <div class="detail-item">
                    <label>កែប្រែចុងក្រោយ</label>
                    <span>${formatDate(card.updated_at)}</span>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeViewModal()">
                    <i class="fas fa-times"></i> បិទ
                </button>
                <button type="button" class="btn btn-success" onclick="closeViewModal(); editCard(${card.id});">
                    <i class="fas fa-edit"></i> កែប្រែ
                </button>
            </div>
        `;
        
        document.getElementById('view-modal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing card:', error);
        showToast('មានបញ្ហាក្នុងការទាញយកព័ត៌មាន', 'error');
    }
}

/**
 * Close modals
 */
function closeModal() {
    document.getElementById('card-modal').classList.remove('active');
}

function closeViewModal() {
    document.getElementById('view-modal').classList.remove('active');
}

/**
 * Confirm delete
 */
function confirmDelete(cardId) {
    if (confirm('តើអ្នកប្រាកដជាចង់លុបព័ត៌មាននេះមែនទេ?')) {
        deleteCard(cardId).then(success => {
            if (success) {
                loadAllCards();
                updateStatistics();
            }
        });
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Load initial data
    loadAllCards();
    updateStatistics();
    populateProvinceDropdowns();
    
    // Form submission
    document.getElementById('card-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cardId = document.getElementById('card-id').value;
        const cardData = {
            id_number: document.getElementById('id_number').value.trim(),
            khmer_name: document.getElementById('khmer_name').value.trim(),
            latin_name: document.getElementById('latin_name').value.trim(),
            date_of_birth: document.getElementById('date_of_birth').value,
            gender: document.getElementById('gender').value,
            nationality: document.getElementById('nationality').value.trim(),
            place_of_birth: document.getElementById('place_of_birth').value.trim(),
            place_of_birth_province: document.getElementById('pob_province').value,
            current_address: document.getElementById('current_address').value.trim(),
            current_address_province: document.getElementById('current_province').value,
            father_name: document.getElementById('father_name').value.trim(),
            mother_name: document.getElementById('mother_name').value.trim(),
            issue_date: document.getElementById('issue_date').value,
            expiry_date: document.getElementById('expiry_date').value,
            photo_url: document.getElementById('photo_url').value.trim()
        };
        
        let result;
        if (cardId) {
            result = await updateCard(cardId, cardData);
        } else {
            result = await createCard(cardData);
        }
        
        if (result) {
            closeModal();
            loadAllCards();
            updateStatistics();
        }
    });
    
    // Search input - enter key
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchIDCards();
        }
    });
    
    // Close modal on outside click
    document.getElementById('card-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    document.getElementById('view-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeViewModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeViewModal();
        }
    });
});

// Add CSS for gender badges
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }
    .badge.male {
        background-color: #e3f2fd;
        color: #1976d2;
    }
    .badge.female {
        background-color: #fce4ec;
        color: #c2185b;
    }
`;
document.head.appendChild(style);