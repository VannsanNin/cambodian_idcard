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
// ADDRESS DATA (Cambodian Provinces, Districts, Communes, Villages)
// ============================================
// Source: assets/Cambodia2025.json
// Structure: { provinceKh: { districtKh: { communeKh: [villageKh, ...] } } }
let addressData = {};
let provinceDropdownsPromise = null;

function ensureProvinceDropdownsReady() {
    if (!provinceDropdownsPromise) {
        provinceDropdownsPromise = populateProvinceDropdowns();
    }
    return provinceDropdownsPromise;
}

/**
 * Load address data from local JSON file (assets/Cambodia2025.json)
 */
async function loadAddressDataFromLocalFile() {
    try {
        const response = await fetch('/assets/Cambodia2025.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const built = buildAddressDataFromCambodiaJson(data);

        if (Object.keys(built).length > 0) {
            addressData = built;
            return true;
        }
    } catch (e) {
        console.warn('Failed to load local address data:', e);
    }
    return false;
}

function buildAddressDataFromCambodiaJson(items = []) {
    const result = {};
    if (!Array.isArray(items)) return result;

    items.forEach(province => {
        const provinceName = province.province_kh || province.province_en || province.province_code;
        if (!provinceName) return;

        if (!result[provinceName]) result[provinceName] = {};

        (province.districts || []).forEach(district => {
            const districtName = district.district_kh || district.district_en || district.district_code;
            if (!districtName) return;

            if (!result[provinceName][districtName]) result[provinceName][districtName] = {};

            (district.communes || []).forEach(commune => {
                const communeName = commune.commune_kh || commune.commune_en || commune.commune_code;
                if (!communeName) return;

                if (!result[provinceName][districtName][communeName]) {
                    result[provinceName][districtName][communeName] = [];
                }

                (commune.villages || []).forEach(village => {
                    const villageName = village.village_kh || village.village_en || village.village_code;
                    if (!villageName) return;

                    if (!result[provinceName][districtName][communeName].includes(villageName)) {
                        result[provinceName][districtName][communeName].push(villageName);
                    }
                });
            });
        });
    });

    return result;
}

function setSelectToPlaceholder(selectId, placeholder, disabled = true) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;
    select.value = '';
    select.disabled = disabled;
}

function resetPobAddressFields() {
    const provinceSelect = document.getElementById('pob_province');
    if (provinceSelect) provinceSelect.value = '';

    setSelectToPlaceholder('pob_district', 'ជ្រើសរើសស្រុក/ខណ្ឌ');
    setSelectToPlaceholder('pob_commune', 'ជ្រើសរើសឃុំ/សង្កាត់');
    setSelectToPlaceholder('pob_village', 'ជ្រើសរើសភូមិ');
}

function updateCardModalHeader(mode = 'create') {
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');

    if (!title || !subtitle) return;

    if (mode === 'edit') {
        title.innerHTML = '<i class="fas fa-edit"></i> កែប្រែកំណត់ត្រាអត្តសញ្ញាណបណ្ណ';
        subtitle.textContent = 'ពិនិត្យ និងកែសម្រួលព័ត៌មានខាងក្រោម មុនពេលរក្សាទុកការផ្លាស់ប្តូរ។';
        return;
    }

    title.innerHTML = '<i class="fas fa-id-card"></i> បង្កើតអត្តសញ្ញាណបណ្ណថ្មី';
    subtitle.textContent = 'បំពេញព័ត៌មានសំខាន់ៗខាងក្រោម ដើម្បីរក្សាទុកកំណត់ត្រាថ្មី។';
}

function updatePhotoPreview(url = '') {
    const image = document.getElementById('photo-preview-image');
    const emptyState = document.getElementById('photo-preview-empty');
    const frame = document.getElementById('photo-preview-frame');
    const normalizedUrl = url.trim();

    if (!image || !emptyState || !frame) return;

    image.onload = () => {
        image.hidden = false;
        emptyState.hidden = true;
        frame.classList.add('has-image');
    };

    image.onerror = () => {
        image.hidden = true;
        image.removeAttribute('src');
        emptyState.hidden = false;
        frame.classList.remove('has-image');
    };

    if (!normalizedUrl) {
        image.hidden = true;
        image.removeAttribute('src');
        emptyState.hidden = false;
        frame.classList.remove('has-image');
        return;
    }

    image.src = normalizedUrl;
}

function isLocalPhotoUrl(value) {
    return String(value ?? '').trim().startsWith(LOCAL_PHOTO_PREFIX);
}

function resetPhotoFilePicker() {
    const fileInput = document.getElementById('photo_file');
    if (fileInput) {
        fileInput.value = '';
    }
}

function setPhotoSourceStatus(message = DEFAULT_PHOTO_SOURCE_STATUS) {
    const status = document.getElementById('photo-source-status');
    if (!status) return;
    status.textContent = message || DEFAULT_PHOTO_SOURCE_STATUS;
}

function updatePhotoSourceStatus(photoUrl = '') {
    if (!photoUrl) {
        setPhotoSourceStatus();
        return;
    }

    if (isLocalPhotoUrl(photoUrl)) {
        setPhotoSourceStatus('កំពុងប្រើរូបដែលបានជ្រើសរើសពីកុំព្យូទ័រ។ អ្នកអាចប្តូររូបថ្មីបានគ្រប់ពេល។');
        return;
    }

    setPhotoSourceStatus('កំពុងប្រើតំណរូបភាព។ អ្នកក៏អាចជ្រើសរើសរូបពីកុំព្យូទ័របានផងដែរ។');
}

async function uploadPhotoFile(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(PHOTO_UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();

    if (!response.ok || !data.success || !data.data?.photo_url) {
        throw new Error(data.message || 'មិនអាចបង្ហោះរូបថតបាន');
    }

    return data.data.photo_url;
}

async function handleLocalPhotoSelection(event) {
    const file = event.target.files?.[0];
    const choosePhotoButton = document.getElementById('choose-photo-btn');

    if (!file) {
        return;
    }

    if (!file.type.startsWith('image/')) {
        showToast('សូមជ្រើសរើសឯកសាររូបភាពតែប៉ុណ្ណោះ', 'error');
        resetPhotoFilePicker();
        return;
    }

    if (file.size > MAX_LOCAL_PHOTO_SIZE) {
        showToast('រូបថតមានទំហំធំពេក។ ទំហំអតិបរមាគឺ 5MB', 'error');
        resetPhotoFilePicker();
        return;
    }

    let idleButtonContent = '';
    if (choosePhotoButton) {
        idleButtonContent = choosePhotoButton.dataset.idleContent || choosePhotoButton.innerHTML;
        choosePhotoButton.dataset.idleContent = idleButtonContent;
        choosePhotoButton.disabled = true;
        choosePhotoButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> កំពុងបង្ហោះ';
    }

    try {
        const uploadedPhotoUrl = await uploadPhotoFile(file);
        const photoUrlInput = document.getElementById('photo_url');

        if (photoUrlInput) {
            photoUrlInput.value = uploadedPhotoUrl;
        }

        updatePhotoPreview(uploadedPhotoUrl);
        updatePhotoSourceStatus(uploadedPhotoUrl);
        showToast(`បានបង្ហោះរូបថត "${file.name}" ជោគជ័យ!`);
    } catch (error) {
        console.error('Error uploading local photo:', error);
        showToast(
            translateApiErrorMessage(error.message) || 'មានបញ្ហាក្នុងការបង្ហោះរូបថត',
            'error'
        );
    } finally {
        if (choosePhotoButton) {
            choosePhotoButton.disabled = false;
            choosePhotoButton.innerHTML = choosePhotoButton.dataset.idleContent || idleButtonContent;
        }
        resetPhotoFilePicker();
    }
}

function clearPhotoSelection() {
    const photoUrlInput = document.getElementById('photo_url');
    if (photoUrlInput) {
        photoUrlInput.value = '';
    }

    resetPhotoFilePicker();
    updatePhotoPreview('');
    setPhotoSourceStatus();
}

// ============================================
// CURRENT ADDRESS CASCADING DROPDOWNS
// ============================================

/**
 * Populate current_district based on current_province selection
 */
function populateCurrentDistricts() {
    const province = document.getElementById('current_province').value;
    const districtSelect = document.getElementById('current_district');
    const communeSelect = document.getElementById('current_commune');
    const villageSelect = document.getElementById('current_village');

    districtSelect.innerHTML = '<option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>';
    communeSelect.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    communeSelect.disabled = true;
    villageSelect.disabled = true;

    if (province && addressData[province]) {
        const districts = Object.keys(addressData[province]);
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    } else {
        districtSelect.disabled = true;
    }
}

/**
 * Populate current_commune based on current_district selection
 */
function populateCurrentCommunes() {
    const province = document.getElementById('current_province').value;
    const district = document.getElementById('current_district').value;
    const communeSelect = document.getElementById('current_commune');
    const villageSelect = document.getElementById('current_village');

    communeSelect.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    villageSelect.disabled = true;

    if (province && district && addressData[province] && addressData[province][district]) {
        const communes = Object.keys(addressData[province][district]);
        communes.forEach(commune => {
            const option = document.createElement('option');
            option.value = commune;
            option.textContent = commune;
            communeSelect.appendChild(option);
        });
        communeSelect.disabled = false;
    } else {
        communeSelect.disabled = true;
    }
}

/**
 * Populate current_village based on current_commune selection
 */
function populateCurrentVillages() {
    const province = document.getElementById('current_province').value;
    const district = document.getElementById('current_district').value;
    const commune = document.getElementById('current_commune').value;
    const villageSelect = document.getElementById('current_village');

    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';

    if (province && district && commune &&
        addressData[province] &&
        addressData[province][district] &&
        addressData[province][district][commune]) {
        const villages = addressData[province][district][commune];
        villages.forEach(village => {
            const option = document.createElement('option');
            option.value = village;
            option.textContent = village;
            villageSelect.appendChild(option);
        });
        villageSelect.disabled = false;
    } else {
        villageSelect.disabled = true;
    }
}

function resetCurrentAddressFields() {
    const provinceSelect = document.getElementById('current_province');
    if (provinceSelect) provinceSelect.value = '';

    setSelectToPlaceholder('current_district', 'ជ្រើសរើសស្រុក/ខណ្ឌ');
    setSelectToPlaceholder('current_commune', 'ជ្រើសរើសឃុំ/សង្កាត់');
    setSelectToPlaceholder('current_village', 'ជ្រើសរើសភូមិ');
}

// ============================================
// PLACE OF BIRTH CASCADING DROPDOWNS
// ============================================

/**
 * Populate pob_district based on pob_province selection
 */
function populatePobDistricts() {
    const province = document.getElementById('pob_province').value;
    const districtSelect = document.getElementById('pob_district');
    const communeSelect = document.getElementById('pob_commune');
    const villageSelect = document.getElementById('pob_village');

    districtSelect.innerHTML = '<option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>';
    communeSelect.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    communeSelect.disabled = true;
    villageSelect.disabled = true;

    if (province && addressData[province]) {
        const districts = Object.keys(addressData[province]);
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    } else {
        districtSelect.disabled = true;
    }
}

/**
 * Populate pob_commune based on pob_district selection
 */
function populatePobCommunes() {
    const province = document.getElementById('pob_province').value;
    const district = document.getElementById('pob_district').value;
    const communeSelect = document.getElementById('pob_commune');
    const villageSelect = document.getElementById('pob_village');

    communeSelect.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    villageSelect.disabled = true;

    if (province && district && addressData[province] && addressData[province][district]) {
        const communes = Object.keys(addressData[province][district]);
        communes.forEach(commune => {
            const option = document.createElement('option');
            option.value = commune;
            option.textContent = commune;
            communeSelect.appendChild(option);
        });
        communeSelect.disabled = false;
    } else {
        communeSelect.disabled = true;
    }
}

/**
 * Populate pob_village based on pob_commune selection
 */
function populatePobVillages() {
    const province = document.getElementById('pob_province').value;
    const district = document.getElementById('pob_district').value;
    const commune = document.getElementById('pob_commune').value;
    const villageSelect = document.getElementById('pob_village');

    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';

    if (province && district && commune &&
        addressData[province] &&
        addressData[province][district] &&
        addressData[province][district][commune]) {
        const villages = addressData[province][district][commune];
        villages.forEach(village => {
            const option = document.createElement('option');
            option.value = village;
            option.textContent = village;
            villageSelect.appendChild(option);
        });
        villageSelect.disabled = false;
    } else {
        villageSelect.disabled = true;
    }
}

/**
 * Set place-of-birth cascading dropdowns from an existing place_of_birth string
 */
function setPobAddressFromString(placeOfBirth) {
    if (!placeOfBirth) return;

    const parts = placeOfBirth.split(', ').map(p => p.trim());
    if (parts.length < 4) return;

    const provincePart = parts[parts.length - 1];
    const districtPart = parts[parts.length - 2];
    const communePart  = parts[parts.length - 3];
    const villagePart  = parts[parts.length - 4];

    const provinceSelect = document.getElementById('pob_province');
    const districtSelect = document.getElementById('pob_district');
    const communeSelect  = document.getElementById('pob_commune');
    const villageSelect  = document.getElementById('pob_village');

    const provinceValue = findSelectValueByTextOrCode(provinceSelect, provincePart);
    if (provinceValue) {
        provinceSelect.value = provinceValue;
        populatePobDistricts();

        const districtValue = findSelectValueByTextOrCode(districtSelect, districtPart);
        if (districtValue) {
            districtSelect.value = districtValue;
            populatePobCommunes();

            const communeValue = findSelectValueByTextOrCode(communeSelect, communePart);
            if (communeValue) {
                communeSelect.value = communeValue;
                populatePobVillages();

                const villageValue = findSelectValueByTextOrCode(villageSelect, villagePart);
                if (villageValue) villageSelect.value = villageValue;
            }
        }
    }
}

/**
 * Set current address cascading dropdowns from an existing current_address string
 */
function setCurrentAddressFromString(currentAddress) {
    if (!currentAddress) return;

    const parts = currentAddress.split(', ').map(p => p.trim());
    // The detailed address part might be at the beginning, so we need to handle it.
    // We assume the last 4 parts are village, commune, district, province.
    // The remaining parts (if any) form the detailed address.
    
    let provincePart = '';
    let districtPart = '';
    let communePart = '';
    let villagePart = '';
    let detailPart = '';

    if (parts.length >= 4) {
        provincePart = parts[parts.length - 1];
        districtPart = parts[parts.length - 2];
        communePart = parts[parts.length - 3];
        villagePart = parts[parts.length - 4];
        detailPart = parts.slice(0, parts.length - 4).join(', ');
    } else {
        // If less than 4 parts, try to match what's available
        if (parts.length >= 1) provincePart = parts[parts.length - 1];
        if (parts.length >= 2) districtPart = parts[parts.length - 2];
        if (parts.length >= 3) communePart = parts[parts.length - 3];
        if (parts.length >= 4) villagePart = parts[parts.length - 4];
        detailPart = parts.slice(0, Math.max(0, parts.length - 4)).join(', ');
    }

    const provinceSelect = document.getElementById('current_province');
    const districtSelect = document.getElementById('current_district');
    const communeSelect = document.getElementById('current_commune');
    const villageSelect = document.getElementById('current_village');
    const currentAddressDetailInput = document.getElementById('current_address_detail'); // Assuming a new input for detail

    if (currentAddressDetailInput) {
        currentAddressDetailInput.value = detailPart;
    }

    const provinceValue = findSelectValueByTextOrCode(provinceSelect, provincePart);
    if (provinceValue) {
        provinceSelect.value = provinceValue;
        populateCurrentDistricts();

        const districtValue = findSelectValueByTextOrCode(districtSelect, districtPart);
        if (districtValue) {
            districtSelect.value = districtValue;
            populateCurrentCommunes();

            const communeValue = findSelectValueByTextOrCode(communeSelect, communePart);
            if (communeValue) {
                communeSelect.value = communeValue;
                populateCurrentVillages();

                const villageValue = findSelectValueByTextOrCode(villageSelect, villagePart);
                if (villageValue) villageSelect.value = villageValue;
            }
        }
    }
}


function findSelectValueByTextOrCode(selectElement, text) {
    if (!selectElement || !text) return null;

    // Try exact value match
    const byValue = Array.from(selectElement.options).find(opt => opt.value === text);
    if (byValue) return byValue.value;

    // Try exact text match
    const byText = Array.from(selectElement.options).find(opt => opt.text === text);
    if (byText) return byText.value;

    // Try to match based on any digits in the string
    const digitsMatch = (text.match(/\d+/) || [null])[0];
    if (digitsMatch) {
        const byDigits = Array.from(selectElement.options).find(opt => opt.value.includes(digitsMatch) || opt.text.includes(digitsMatch));
        if (byDigits) return byDigits.value;
    }

    return null;
}

// ============================================
// LOCATION DATA (MEF API)
// ============================================

const LOCATION_API_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_66a8603a00604c000123e147/json';
const LOCATION_API_PAGE_SIZE = 200;
const LOCATION_CACHE_KEY = 'mef_location_cache';
const LOCATION_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function fetchAllLocationItems() {
    // Use localStorage cache to avoid repeated heavy requests
    try {
        const cached = localStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.timestamp && Date.now() - parsed.timestamp < LOCATION_CACHE_TTL && Array.isArray(parsed.items)) {
                return parsed.items;
            }
        }
    } catch (e) {
        console.warn('Failed to read location cache', e);
    }

    const items = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const response = await fetch(`${LOCATION_API_URL}?page=${page}&page_size=${LOCATION_API_PAGE_SIZE}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch location data (page ${page}): ${response.statusText}`);
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.items)) break;

        items.push(...data.items);
        totalPages = data.total_pages || totalPages;
        page += 1;
    }

    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items }));
    } catch (e) {
        console.warn('Failed to write location cache', e);
    }

    return items;
}

function buildAddressDataFromItems(items, provinceMap = {}) {
    const result = {};

    items.forEach(item => {
        const provinceName = provinceMap[item.province_code] || item.province_code;
        const districtCode = item.district_code;
        const communeCode = item.commune_code;
        const villageName = item.village_kh || item.village_en || item.village_code;

        if (!provinceName || !districtCode || !communeCode) return;

        if (!result[provinceName]) result[provinceName] = {};
        if (!result[provinceName][districtCode]) result[provinceName][districtCode] = {};
        if (!result[provinceName][districtCode][communeCode]) result[provinceName][districtCode][communeCode] = [];

        if (!result[provinceName][districtCode][communeCode].includes(villageName)) {
            result[provinceName][districtCode][communeCode].push(villageName);
        }
    });

    return result;
}

async function loadAddressDataFromApi(provinces) {
    try {
        const items = await fetchAllLocationItems();
        const provinceMap = (provinces || []).reduce((acc, p) => {
            if (p.province_code && p.province_kh) acc[p.province_code] = p.province_kh;
            return acc;
        }, {});

        const apiData = buildAddressDataFromItems(items, provinceMap);
        if (Object.keys(apiData).length > 0) {
            addressData = apiData;
        }
    } catch (e) {
        console.warn('Failed to load address data from MEF API:', e);
    }
}

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = '/api';
const PROVINCE_API_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_66a8603700604c000123e144/json?page=1&page_size=30';
const PHOTO_UPLOAD_ENDPOINT = `${API_BASE_URL}/uploads/photo`;
const VALIDITY_PERIOD_YEARS = 5;
const INPUT_LIMITS = {
    search: 100,
    id_number: 20,
    khmer_name: 100,
    latin_name: 100,
    father_name: 100,
    mother_name: 100,
    current_address_detail: 150,
    photo_url: 500
};
const VALID_ID_NUMBER_REGEX = /^\d{5,20}$/;
const SAFE_GENDERS = new Set(['ប្រុស', 'ស្រី']);
const LOCAL_PHOTO_PREFIX = '/static/uploads/photos/';
const MAX_LOCAL_PHOTO_SIZE = 5 * 1024 * 1024;
const DEFAULT_PHOTO_SOURCE_STATUS = 'អាចប្រើតំណរូបភាពសាធារណៈ ឬជ្រើសរើសរូបពីកុំព្យូទ័រ។ ឯកសារដែលគាំទ្រ៖ JPG, PNG, GIF, WEBP ទំហំអតិបរមា 5MB។';
const KHMER_ONLY_FIELD_IDS = ['khmer_name', 'father_name', 'mother_name'];
const KHMER_ONLY_INPUT_REGEX = /^[\u1780-\u17FF\s]+$/u;
const NON_KHMER_INPUT_REGEX = /[^\u1780-\u17FF\s]/gu;
const LATIN_ONLY_FIELD_IDS = ['latin_name'];
const LATIN_NAME_INPUT_REGEX = /^[A-Za-z\s.'-]+$/;
const NON_LATIN_NAME_INPUT_REGEX = /[^A-Za-z\s.'-]/g;
const FIELD_DISPLAY_NAMES = {
    id_number: 'លេខអត្តសញ្ញាណបណ្ណ',
    khmer_name: 'ឈ្មោះពេញជាភាសាខ្មែរ',
    latin_name: 'ឈ្មោះពេញជាអក្សរឡាតាំង',
    date_of_birth: 'ថ្ងៃខែឆ្នាំកំណើត',
    gender: 'ភេទ',
    nationality: 'សញ្ជាតិ',
    place_of_birth: 'ទីកន្លែងកំណើត',
    place_of_birth_province: 'ខេត្ត/រាជធានីកំណើត',
    current_address: 'អាសយដ្ឋានបច្ចុប្បន្ន',
    current_address_province: 'ខេត្ត/រាជធានីបច្ចុប្បន្ន',
    father_name: 'ឈ្មោះឪពុក',
    mother_name: 'ឈ្មោះម្តាយ',
    issue_date: 'ថ្ងៃចេញប័ណ្ណ',
    expiry_date: 'ថ្ងៃផុតសុពលភាព',
    photo_url: 'តំណរូបថត',
    pob_province: 'ខេត្ត/រាជធានីកំណើត',
    pob_district: 'ស្រុក/ខណ្ឌកំណើត',
    pob_commune: 'ឃុំ/សង្កាត់កំណើត',
    pob_village: 'ភូមិកំណើត',
    current_province: 'ខេត្ត/រាជធានីបច្ចុប្បន្ន',
    current_district: 'ស្រុក/ខណ្ឌបច្ចុប្បន្ន',
    current_commune: 'ឃុំ/សង្កាត់បច្ចុប្បន្ន',
    current_village: 'ភូមិបច្ចុប្បន្ន'
};
const REQUIRED_FIELD_MESSAGES = {
    khmer_name: 'សូមបញ្ចូលឈ្មោះពេញជាភាសាខ្មែរ',
    latin_name: 'សូមបញ្ចូលឈ្មោះពេញជាអក្សរឡាតាំង',
    date_of_birth: 'សូមជ្រើសរើសថ្ងៃខែឆ្នាំកំណើត',
    gender: 'សូមជ្រើសរើសភេទឲ្យត្រឹមត្រូវ',
    pob_province: 'សូមជ្រើសរើសខេត្ត/រាជធានីកំណើត',
    pob_district: 'សូមជ្រើសរើសស្រុក/ខណ្ឌកំណើត',
    pob_commune: 'សូមជ្រើសរើសឃុំ/សង្កាត់កំណើត',
    pob_village: 'សូមជ្រើសរើសភូមិកំណើត',
    current_province: 'សូមជ្រើសរើសខេត្ត/រាជធានីបច្ចុប្បន្ន',
    current_district: 'សូមជ្រើសរើសស្រុក/ខណ្ឌបច្ចុប្បន្ន',
    current_commune: 'សូមជ្រើសរើសឃុំ/សង្កាត់បច្ចុប្បន្ន',
    current_village: 'សូមជ្រើសរើសភូមិបច្ចុប្បន្ន',
    father_name: 'សូមបញ្ចូលឈ្មោះឪពុក',
    mother_name: 'សូមបញ្ចូលឈ្មោះម្តាយ',
    issue_date: 'សូមជ្រើសរើសថ្ងៃចេញប័ណ្ណ',
    expiry_date: 'សូមជ្រើសរើសថ្ងៃផុតសុពលភាព',
    photo_url: 'សូមបញ្ចូលតំណរូបថត ឬជ្រើសរើសរូបពីកុំព្យូទ័រ'
};
const KHMER_ONLY_FIELD_MESSAGES = {
    khmer_name: 'ឈ្មោះពេញជាភាសាខ្មែរ អាចបញ្ចូលបានតែអក្សរខ្មែរ',
    father_name: 'ឈ្មោះឪពុក អាចបញ្ចូលបានតែអក្សរខ្មែរ',
    mother_name: 'ឈ្មោះម្តាយ អាចបញ្ចូលបានតែអក្សរខ្មែរ'
};
const LATIN_ONLY_FIELD_MESSAGES = {
    latin_name: 'ឈ្មោះពេញជាអក្សរឡាតាំង អាចបញ្ចូលបានតែអក្សរអង់គ្លេស'
};
const FORMAT_FIELD_MESSAGES = {
    khmer_name: KHMER_ONLY_FIELD_MESSAGES.khmer_name,
    latin_name: LATIN_ONLY_FIELD_MESSAGES.latin_name,
    father_name: KHMER_ONLY_FIELD_MESSAGES.father_name,
    mother_name: KHMER_ONLY_FIELD_MESSAGES.mother_name,
    id_number: 'លេខអត្តសញ្ញាណបណ្ណត្រូវមានតែលេខ 5 ដល់ 20 ខ្ទង់',
    date_of_birth: 'ថ្ងៃខែឆ្នាំកំណើតមិនត្រឹមត្រូវ',
    issue_date: 'ថ្ងៃចេញប័ណ្ណមិនត្រឹមត្រូវ',
    expiry_date: 'ថ្ងៃផុតសុពលភាពមិនត្រឹមត្រូវ',
    photo_url: 'តំណរូបថតត្រូវចាប់ផ្តើមដោយ http:// ឬ https:// ឬជ្រើសរើសរូបពីកុំព្យូទ័រ'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function removeUnsafeControlChars(value) {
    return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
}

function normalizeSingleLineWhitespace(value) {
    return removeUnsafeControlChars(value)
        .replace(/\s+/g, ' ')
        .trim();
}

function sanitizeSingleLineInput(value, maxLength = 100) {
    return normalizeSingleLineWhitespace(value).slice(0, maxLength);
}

function sanitizeMultilineInput(value, maxLength = 300) {
    return removeUnsafeControlChars(value)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function sanitizeIdNumberInput(value, maxLength = 20) {
    return removeUnsafeControlChars(value)
        .replace(/\s+/g, '')
        .slice(0, maxLength);
}

function sanitizeDigitsInput(value, maxLength = 20) {
    return String(value ?? '')
        .replace(/\D/g, '')
        .slice(0, maxLength);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateInputValue(value) {
    const normalized = String(value ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return null;
    }

    const [year, month, day] = normalized.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function addYearsClamped(date, years) {
    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    nextDate.setFullYear(nextDate.getFullYear() + years);

    if (nextDate.getMonth() !== date.getMonth()) {
        nextDate.setDate(0);
    }

    return nextDate;
}

function calculateExpiryDateValue(issueDateValue) {
    const parsedIssueDate = parseDateInputValue(issueDateValue);
    if (!parsedIssueDate) {
        return '';
    }

    return formatDateForInput(addYearsClamped(parsedIssueDate, VALIDITY_PERIOD_YEARS));
}

function syncExpiryDateFromIssueDate() {
    const issueDateInput = document.getElementById('issue_date');
    const expiryDateInput = document.getElementById('expiry_date');

    if (!issueDateInput || !expiryDateInput) {
        return '';
    }

    const computedExpiryDate = calculateExpiryDateValue(issueDateInput.value);
    expiryDateInput.value = computedExpiryDate;
    return computedExpiryDate;
}

function initializeAutoValidityDates(force = false) {
    const issueDateInput = document.getElementById('issue_date');
    if (!issueDateInput) {
        return;
    }

    if (force || !issueDateInput.value) {
        issueDateInput.value = formatDateForInput(new Date());
    }

    syncExpiryDateFromIssueDate();
}

function sanitizeKhmerOnlyInput(value, maxLength = 100) {
    return normalizeSingleLineWhitespace(String(value ?? '').replace(NON_KHMER_INPUT_REGEX, ''))
        .slice(0, maxLength);
}

function containsOnlyKhmerInput(value) {
    const normalized = normalizeSingleLineWhitespace(value);
    return !normalized || KHMER_ONLY_INPUT_REGEX.test(normalized);
}

function sanitizeLatinNameInput(value, maxLength = 100) {
    return normalizeSingleLineWhitespace(String(value ?? '').replace(NON_LATIN_NAME_INPUT_REGEX, ''))
        .slice(0, maxLength);
}

function containsOnlyLatinNameInput(value) {
    const normalized = normalizeSingleLineWhitespace(value);
    return !normalized || LATIN_NAME_INPUT_REGEX.test(normalized);
}

function replaceSelectedText(element, text, sanitizer) {
    if (!element) return;

    const currentValue = element.value ?? '';
    const start = element.selectionStart ?? currentValue.length;
    const end = element.selectionEnd ?? start;
    const nextValue = `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`;

    element.value = sanitizer(nextValue);

    const caretPosition = Math.min(start + text.length, element.value.length);
    if (typeof element.setSelectionRange === 'function') {
        element.setSelectionRange(caretPosition, caretPosition);
    }
}

function installRestrictedTypingProtection(elementId, maxLength, sanitizer) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('beforeinput', event => {
        if (
            event.isComposing ||
            !event.data ||
            event.inputType === 'insertCompositionText' ||
            event.inputType?.startsWith('delete')
        ) {
            return;
        }

        const sanitizedData = sanitizer(event.data);
        const normalizedData = sanitizeSingleLineInput(event.data, maxLength);

        if (sanitizedData === normalizedData) {
            return;
        }

        event.preventDefault();
        if (!sanitizedData) {
            return;
        }

        replaceSelectedText(element, sanitizedData, sanitizer);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    });

    element.addEventListener('paste', event => {
        const pastedText = event.clipboardData?.getData('text');
        if (typeof pastedText !== 'string') {
            return;
        }

        const sanitizedText = sanitizer(pastedText);
        const normalizedText = sanitizeSingleLineInput(pastedText, maxLength);

        if (sanitizedText === normalizedText) {
            return;
        }

        event.preventDefault();
        if (!sanitizedText) {
            return;
        }

        replaceSelectedText(element, sanitizedText, sanitizer);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

function installKhmerOnlyTypingProtection(elementId, maxLength) {
    installRestrictedTypingProtection(
        elementId,
        maxLength,
        value => sanitizeKhmerOnlyInput(value, maxLength)
    );
}

function installLatinOnlyTypingProtection(elementId, maxLength) {
    installRestrictedTypingProtection(
        elementId,
        maxLength,
        value => sanitizeLatinNameInput(value, maxLength)
    );
}

function isValidHttpUrl(value) {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
        return false;
    }

    if (isLocalPhotoUrl(normalized)) {
        return true;
    }

    try {
        const parsed = new URL(normalized, window.location.origin);
        return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.host);
    } catch (error) {
        return false;
    }
}

function installInputProtection() {
    const sanitizers = [
        ['search-input', value => sanitizeSingleLineInput(value, INPUT_LIMITS.search)],
        ['id_number', value => sanitizeIdNumberInput(value, INPUT_LIMITS.id_number)],
        ['khmer_name', value => sanitizeKhmerOnlyInput(value, INPUT_LIMITS.khmer_name)],
        ['latin_name', value => sanitizeLatinNameInput(value, INPUT_LIMITS.latin_name)],
        ['father_name', value => sanitizeKhmerOnlyInput(value, INPUT_LIMITS.father_name)],
        ['mother_name', value => sanitizeKhmerOnlyInput(value, INPUT_LIMITS.mother_name)],
        ['current_address_detail', value => sanitizeMultilineInput(value, INPUT_LIMITS.current_address_detail)],
        ['photo_url', value => sanitizeSingleLineInput(value, INPUT_LIMITS.photo_url)]
    ];

    sanitizers.forEach(([elementId, sanitizer]) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.addEventListener('input', event => {
            const sanitized = sanitizer(event.target.value);
            if (sanitized !== event.target.value) {
                event.target.value = sanitized;
            }
        });

        element.addEventListener('blur', event => {
            event.target.value = sanitizer(event.target.value);
        });
    });

    KHMER_ONLY_FIELD_IDS.forEach(fieldId => {
        installKhmerOnlyTypingProtection(fieldId, INPUT_LIMITS[fieldId] || 100);
    });

    LATIN_ONLY_FIELD_IDS.forEach(fieldId => {
        installLatinOnlyTypingProtection(fieldId, INPUT_LIMITS[fieldId] || 100);
    });
}

function getFieldDisplayName(fieldKey) {
    return FIELD_DISPLAY_NAMES[fieldKey] || fieldKey;
}

function getNativeFieldValidationMessage(field) {
    if (!field?.validity) {
        return 'សូមពិនិត្យទម្រង់ព័ត៌មានដែលបានបញ្ចូលម្ដងទៀត';
    }

    if (field.validity.valueMissing && REQUIRED_FIELD_MESSAGES[field.id]) {
        return REQUIRED_FIELD_MESSAGES[field.id];
    }

    if (
        (field.validity.patternMismatch || field.validity.typeMismatch || field.validity.badInput) &&
        FORMAT_FIELD_MESSAGES[field.id]
    ) {
        return FORMAT_FIELD_MESSAGES[field.id];
    }

    if (field.validity.tooLong) {
        return `${getFieldDisplayName(field.id)}លើសចំនួនអក្សរអតិបរមា ${field.maxLength}`;
    }

    return field.validationMessage || 'សូមពិនិត្យទម្រង់ព័ត៌មានដែលបានបញ្ចូលម្ដងទៀត';
}

function clearFieldValidationState(field) {
    if (!field) return;

    const formGroup = field.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.remove('has-error');
    const errorMessage = formGroup.querySelector('.field-error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showFieldValidationState(field, message) {
    if (!field) return;

    const formGroup = field.closest('.form-group');
    if (!formGroup) return;

    clearFieldValidationState(field);
    formGroup.classList.add('has-error');

    const errorMessage = document.createElement('small');
    errorMessage.className = 'field-error-message';
    errorMessage.textContent = message;
    formGroup.appendChild(errorMessage);
}

function clearFormValidationState(form) {
    if (!form) return;

    Array.from(form.elements).forEach(field => {
        if (!field || typeof field.setCustomValidity !== 'function') return;
        field.setCustomValidity('');
        clearFieldValidationState(field);
    });
}

function installFormValidationAlerts() {
    const form = document.getElementById('card-form');
    if (!form) return;

    form.noValidate = true;

    Array.from(form.elements).forEach(field => {
        if (!field || typeof field.setCustomValidity !== 'function') return;

        const clearValidation = () => {
            field.setCustomValidity('');
            clearFieldValidationState(field);
        };
        field.addEventListener('input', clearValidation);
        field.addEventListener('change', clearValidation);
    });
}

function validateNativeCardForm(form) {
    if (!form) return '';

    const fields = Array.from(form.elements).filter(field => field?.willValidate && !field.disabled);

    clearFormValidationState(form);

    for (const field of fields) {
        if (field.dataset.khmerOnly === 'true' && field.value && !containsOnlyKhmerInput(field.value)) {
            field.setCustomValidity(
                FORMAT_FIELD_MESSAGES[field.id] || `${getFieldDisplayName(field.id)}អាចបញ្ចូលបានតែអក្សរខ្មែរ`
            );
        }

        if (field.dataset.latinOnly === 'true' && field.value && !containsOnlyLatinNameInput(field.value)) {
            field.setCustomValidity(
                FORMAT_FIELD_MESSAGES[field.id] || `${getFieldDisplayName(field.id)}អាចបញ្ចូលបានតែអក្សរអង់គ្លេស`
            );
        }

        if (field.checkValidity()) {
            continue;
        }

        const message = getNativeFieldValidationMessage(field);
        field.setCustomValidity(message);
        showFieldValidationState(field, message);
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field.focus();
        showToast(message, 'error');
        return message;
    }

    return '';
}

function translateApiErrorMessage(message) {
    const normalizedMessage = String(message ?? '').trim();
    if (!normalizedMessage) return '';

    const directTranslations = {
        'Invalid JSON payload': 'ទិន្នន័យដែលបានផ្ញើមិនត្រឹមត្រូវ',
        'ID number must contain only 5 to 20 digits': FORMAT_FIELD_MESSAGES.id_number,
        'photo_url must start with http:// or https://': FORMAT_FIELD_MESSAGES.photo_url,
        'photo_url must start with http:// or https:// or use a local uploaded image': FORMAT_FIELD_MESSAGES.photo_url,
        'Invalid gender value': 'សូមជ្រើសរើសភេទឲ្យត្រឹមត្រូវ',
        'issue_date cannot be earlier than date_of_birth': 'ថ្ងៃចេញប័ណ្ណមិនអាចមុនថ្ងៃកំណើតបានទេ',
        'expiry_date must be later than issue_date': 'ថ្ងៃផុតសុពលភាពត្រូវតែក្រោយថ្ងៃចេញប័ណ្ណ',
        'ID number already exists': 'លេខអត្តសញ្ញាណបណ្ណនេះមានរួចហើយ',
        'ID Card not found': 'រកមិនឃើញព័ត៌មានអត្តសញ្ញាណបណ្ណ',
        'No photo file provided': 'មិនមានឯកសាររូបថតត្រូវបានផ្ញើមក',
        'Photo filename is required': 'សូមជ្រើសរើសឯកសាររូបថត',
        'Unsupported photo format': 'ប្រភេទឯកសាររូបថតមិនត្រូវបានគាំទ្រ',
        'Uploaded file must be an image': 'សូមជ្រើសរើសឯកសាររូបភាពតែប៉ុណ្ណោះ',
        'Uploaded photo is too large. Maximum size is 5 MB': 'រូបថតមានទំហំធំពេក។ ទំហំអតិបរមាគឺ 5MB'
    };

    if (directTranslations[normalizedMessage]) {
        return directTranslations[normalizedMessage];
    }

    const requiredMatch = normalizedMessage.match(/^Field ([a-z_]+) is required$/);
    if (requiredMatch) {
        const fieldKey = requiredMatch[1];
        return REQUIRED_FIELD_MESSAGES[fieldKey] || `សូមបំពេញ${getFieldDisplayName(fieldKey)}`;
    }

    const dateFormatMatch = normalizedMessage.match(/^Field ([a-z_]+) must use YYYY-MM-DD format$/);
    if (dateFormatMatch) {
        const fieldKey = dateFormatMatch[1];
        return FORMAT_FIELD_MESSAGES[fieldKey] || `${getFieldDisplayName(fieldKey)}មិនត្រឹមត្រូវ`;
    }

    const maxLengthMatch = normalizedMessage.match(/^Field ([a-z_]+) exceeds max length of (\d+)$/);
    if (maxLengthMatch) {
        const [, fieldKey, limit] = maxLengthMatch;
        return `${getFieldDisplayName(fieldKey)}លើសចំនួនអក្សរអតិបរមា ${limit}`;
    }

    const khmerOnlyMatch = normalizedMessage.match(/^Field ([a-z_]+) must contain only Khmer characters$/);
    if (khmerOnlyMatch) {
        const fieldKey = khmerOnlyMatch[1];
        return FORMAT_FIELD_MESSAGES[fieldKey] || `${getFieldDisplayName(fieldKey)}អាចបញ្ចូលបានតែអក្សរខ្មែរ`;
    }

    const latinOnlyMatch = normalizedMessage.match(/^Field ([a-z_]+) must contain only English letters$/);
    if (latinOnlyMatch) {
        const fieldKey = latinOnlyMatch[1];
        return FORMAT_FIELD_MESSAGES[fieldKey] || `${getFieldDisplayName(fieldKey)}អាចបញ្ចូលបានតែអក្សរអង់គ្លេស`;
    }

    if (
        normalizedMessage.startsWith('Error uploading photo:') ||
        normalizedMessage.startsWith('Error creating ID card:') ||
        normalizedMessage.startsWith('Error updating ID card:')
    ) {
        return normalizedMessage.startsWith('Error uploading photo:')
            ? 'មានបញ្ហាក្នុងការបង្ហោះរូបថត'
            : 'មានបញ្ហាក្នុងការរក្សាទុកព័ត៌មាន';
    }

    return normalizedMessage;
}

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

function setIdGeneratorVisibility(visible) {
    const button = document.getElementById('generate-id-btn');
    if (!button) return;

    button.hidden = !visible;
    button.disabled = false;
}

async function fetchGeneratedIdNumber() {
    const response = await fetch(`${API_BASE_URL}/id-cards/generate-id`);
    const data = await response.json();

    if (!response.ok || !data.success || !data.data?.id_number) {
        throw new Error(data.message || 'មិនអាចបង្កើតលេខអត្តសញ្ញាណបណ្ណបាន');
    }

    return sanitizeDigitsInput(data.data.id_number, INPUT_LIMITS.id_number);
}

async function generateIdNumber(force = false) {
    const input = document.getElementById('id_number');
    const button = document.getElementById('generate-id-btn');

    if (!input) return '';
    if (!force && input.value.trim()) return input.value.trim();

    let idleButtonContent = '';
    if (button) {
        idleButtonContent = button.dataset.idleContent || button.innerHTML;
        button.dataset.idleContent = idleButtonContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> កំពុងបង្កើត';
    }

    try {
        const generatedId = await fetchGeneratedIdNumber();
        input.value = generatedId;
        return generatedId;
    } catch (error) {
        console.error('Error generating ID number:', error);
        showToast(error.message || 'មិនអាចបង្កើតលេខអត្តសញ្ញាណបណ្ណបាន', 'error');
        return '';
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = button.dataset.idleContent || idleButtonContent;
        }
    }
}

function sanitizeCardFormInputs() {
    const idNumber = document.getElementById('id_number');
    const khmerName = document.getElementById('khmer_name');
    const latinName = document.getElementById('latin_name');
    const fatherName = document.getElementById('father_name');
    const motherName = document.getElementById('mother_name');
    const currentAddressDetail = document.getElementById('current_address_detail');
    const photoUrl = document.getElementById('photo_url');

    if (idNumber) idNumber.value = sanitizeIdNumberInput(idNumber.value, INPUT_LIMITS.id_number);
    if (khmerName) khmerName.value = sanitizeKhmerOnlyInput(khmerName.value, INPUT_LIMITS.khmer_name);
    if (latinName) latinName.value = sanitizeLatinNameInput(latinName.value, INPUT_LIMITS.latin_name);
    if (fatherName) fatherName.value = sanitizeKhmerOnlyInput(fatherName.value, INPUT_LIMITS.father_name);
    if (motherName) motherName.value = sanitizeKhmerOnlyInput(motherName.value, INPUT_LIMITS.mother_name);
    if (currentAddressDetail) {
        currentAddressDetail.value = sanitizeMultilineInput(
            currentAddressDetail.value,
            INPUT_LIMITS.current_address_detail
        );
    }
    if (photoUrl) photoUrl.value = sanitizeSingleLineInput(photoUrl.value, INPUT_LIMITS.photo_url);
}

function validateCardData(cardData, { isEdit = false } = {}) {
    if (cardData.id_number && !VALID_ID_NUMBER_REGEX.test(cardData.id_number)) {
        return 'លេខអត្តសញ្ញាណបណ្ណត្រូវមានតែលេខ 5 ដល់ 20 ខ្ទង់';
    }

    if (isEdit && !cardData.id_number) {
        return 'សូមបញ្ចូលលេខអត្តសញ្ញាណបណ្ណ';
    }

    if (!cardData.khmer_name) return 'សូមបញ្ចូលឈ្មោះពេញជាភាសាខ្មែរ';
    if (!cardData.latin_name) return 'សូមបញ្ចូលឈ្មោះពេញជាអក្សរឡាតាំង';
    if (!cardData.date_of_birth) return 'សូមជ្រើសរើសថ្ងៃខែឆ្នាំកំណើត';
    if (!SAFE_GENDERS.has(cardData.gender)) return 'សូមជ្រើសរើសភេទឲ្យត្រឹមត្រូវ';
    if (!cardData.place_of_birth) return 'សូមបំពេញទីកន្លែងកំណើតឲ្យបានពេញលេញ';
    if (!cardData.current_address) return 'សូមបំពេញអាសយដ្ឋានបច្ចុប្បន្នឲ្យបានពេញលេញ';
    if (!cardData.father_name) return 'សូមបញ្ចូលឈ្មោះឪពុក';
    if (!cardData.mother_name) return 'សូមបញ្ចូលឈ្មោះម្តាយ';
    if (!cardData.issue_date) return 'សូមជ្រើសរើសថ្ងៃចេញប័ណ្ណ';
    if (!cardData.expiry_date) return 'សូមជ្រើសរើសថ្ងៃផុតសុពលភាព';
    if (!cardData.photo_url) return REQUIRED_FIELD_MESSAGES.photo_url;
    if (!containsOnlyKhmerInput(cardData.khmer_name)) return FORMAT_FIELD_MESSAGES.khmer_name;
    if (!containsOnlyLatinNameInput(cardData.latin_name)) return FORMAT_FIELD_MESSAGES.latin_name;
    if (!containsOnlyKhmerInput(cardData.father_name)) return FORMAT_FIELD_MESSAGES.father_name;
    if (!containsOnlyKhmerInput(cardData.mother_name)) return FORMAT_FIELD_MESSAGES.mother_name;

    const dateOfBirth = new Date(cardData.date_of_birth);
    const issueDate = new Date(cardData.issue_date);
    const expiryDate = new Date(cardData.expiry_date);
    const expectedExpiryDate = calculateExpiryDateValue(cardData.issue_date);

    if (Number.isNaN(dateOfBirth.getTime())) return 'ថ្ងៃខែឆ្នាំកំណើតមិនត្រឹមត្រូវ';
    if (Number.isNaN(issueDate.getTime())) return 'ថ្ងៃចេញប័ណ្ណមិនត្រឹមត្រូវ';
    if (Number.isNaN(expiryDate.getTime())) return 'ថ្ងៃផុតសុពលភាពមិនត្រឹមត្រូវ';

    if (issueDate < dateOfBirth) {
        return 'ថ្ងៃចេញប័ណ្ណមិនអាចមុនថ្ងៃកំណើតបានទេ';
    }

    if (expiryDate <= issueDate) {
        return 'ថ្ងៃផុតសុពលភាពត្រូវតែក្រោយថ្ងៃចេញប័ណ្ណ';
    }

    if (expectedExpiryDate && cardData.expiry_date !== expectedExpiryDate) {
        return `ថ្ងៃផុតសុពលភាពត្រូវស្មើថ្ងៃចេញប័ណ្ណបូក ${VALIDITY_PERIOD_YEARS} ឆ្នាំ`;
    }

    if (cardData.photo_url && !isValidHttpUrl(cardData.photo_url)) {
        return 'តំណរូបថតត្រូវចាប់ផ្តើមដោយ http:// ឬ https://';
    }

    return '';
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
    const pobSelect = document.getElementById('pob_province');
    const currentSelect = document.getElementById('current_province');

    const defaultOption = '<option value="">ជ្រើសរើសខេត្ត/រាជធានី</option>';

    // Show loading state while we fetch data
    pobSelect.innerHTML = '<option value="">កំពុងទាញយកទិន្នន័យ...</option>';
    currentSelect.innerHTML = '<option value="">កំពុងទាញយកទិន្នន័យ...</option>';
    pobSelect.disabled = true;
    currentSelect.disabled = true;

    const loadedLocal = await loadAddressDataFromLocalFile();

    if (!loadedLocal) {
        // Fallback: load from MEF API if local JSON not available
        const provinces = await fetchProvinces();
        if (provinces.length === 0) {
            pobSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្នន័យបាន</option>';
            currentSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្នន័យបាន</option>';
            pobSelect.disabled = true;
            currentSelect.disabled = true;
            return;
        }

        // If using API, the addressData will be populated with codes, so we need to map them to names for display
        // This part might need adjustment if the API data structure is different for display vs internal use
        // For now, we assume addressData is built with Khmer names from buildAddressDataFromItems
        await loadAddressDataFromApi(provinces);
    }

    if (addressData && Object.keys(addressData).length > 0) {
        const provinceItems = Object.keys(addressData).sort((a, b) => a.localeCompare(b, 'km'));
        const provinceOptions = provinceItems.map(p => `<option value="${p}">${p}</option>`).join('');

        pobSelect.innerHTML = defaultOption + provinceOptions;
        pobSelect.disabled = false;

        currentSelect.innerHTML = defaultOption + provinceOptions;
        currentSelect.disabled = false;

        // Initialize cascading for current address too
        setSelectToPlaceholder('current_district', 'ជ្រើសរើសស្រុក/ខណ្ឌ');
        setSelectToPlaceholder('current_commune', 'ជ្រើសរើសឃុំ/សង្កាត់');
        setSelectToPlaceholder('current_village', 'ជ្រើសរើសភូមិ');
    } else {
        pobSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្នន័យបាន</option>';
        currentSelect.innerHTML = '<option value="">មិនអាចទាញយកទិន្ន័យបាន</option>';
        pobSelect.disabled = true;
        currentSelect.disabled = true;
    }
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
            showToast('បង្កើតព័ត៌មានជោគជ័យ!');
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error creating card:', error);
        showToast(
            translateApiErrorMessage(error.message) || 'មានបញ្ហាក្នុងការបង្កើតព័ត៌មាន',
            'error'
        );
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
        showToast(
            translateApiErrorMessage(error.message) || 'មានបញ្ហាក្នុងការកែប្រែ',
            'error'
        );
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
        const safePhotoUrl = card.photo_url && isValidHttpUrl(card.photo_url)
            ? escapeHtml(card.photo_url)
            : '';
        const safeKhmerName = escapeHtml(card.khmer_name);
        const safeLatinName = escapeHtml(card.latin_name);
        const safeIdNumber = escapeHtml(card.id_number);
        const safePlaceOfBirth = escapeHtml(card.place_of_birth);
        const safeGender = card.gender === 'ប្រុស' ? 'ប្រុស' : card.gender === 'ស្រី' ? 'ស្រី' : '-';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="photo-cell">
                ${safePhotoUrl
                    ? `<img src="${safePhotoUrl}" alt="${safeKhmerName}" onerror="this.parentElement.innerHTML='<div class=\\'no-photo\\'><i class=\\'fas fa-user\\'></i></div>'">`
                    : `<div class="no-photo"><i class="fas fa-user\\'></i></div>`
                }
            </td>
            <td><strong>${safeIdNumber}</strong></td>
            <td>${safeKhmerName}</td>
            <td>${safeLatinName}</td>
            <td>
                <span class="badge ${card.gender === 'ប្រុស' ? 'male' : 'female'}">
                    ${safeGender}
                </span>
            </td>
            <td>${formatDate(card.date_of_birth)}</td>
            <td>${safePlaceOfBirth}</td>
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
    const searchInput = document.getElementById('search-input');
    const query = sanitizeSingleLineInput(searchInput.value, INPUT_LIMITS.search);
    searchInput.value = query;
    
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
async function showAddModal() {
    await ensureProvinceDropdownsReady();
    const form = document.getElementById('card-form');
    form.reset();
    clearFormValidationState(form);
    document.getElementById('card-id').value = '';
    document.getElementById('nationality').value = 'ខ្មែរ';
    document.getElementById('id_number').value = '';
    resetCurrentAddressFields();
    resetPobAddressFields();
    resetPhotoFilePicker();
    updateCardModalHeader('create');
    updatePhotoPreview('');
    setPhotoSourceStatus();
    setIdGeneratorVisibility(true);
    initializeAutoValidityDates(true);
    document.getElementById('card-modal').classList.add('active');
    await generateIdNumber(true);
}

/**
 * Show edit modal
 */
async function editCard(cardId) {
    try {
        await ensureProvinceDropdownsReady();

        const response = await fetch(`${API_BASE_URL}/id-cards/${cardId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const card = data.data;

        const form = document.getElementById('card-form');
        form.reset();
        clearFormValidationState(form);
        document.getElementById('card-id').value = card.id;
        document.getElementById('id_number').value = card.id_number;
        document.getElementById('khmer_name').value = card.khmer_name;
        document.getElementById('latin_name').value = card.latin_name;
        document.getElementById('date_of_birth').value = card.date_of_birth;
        document.getElementById('gender').value = card.gender;
        document.getElementById('nationality').value = card.nationality;
        document.getElementById('current_address_detail').value = ''; // Reset detail field first

        resetPobAddressFields();
        resetCurrentAddressFields();

        // Restore place-of-birth cascading dropdowns
        if (card.place_of_birth) {
            setPobAddressFromString(card.place_of_birth);
        } else if (card.place_of_birth_province) {
            document.getElementById('pob_province').value = card.place_of_birth_province;
            populatePobDistricts();
        }

        // Restore current address cascading dropdowns
        if (card.current_address) {
            setCurrentAddressFromString(card.current_address);
        } else if (card.current_address_province) {
            document.getElementById('current_province').value = card.current_address_province;
            populateCurrentDistricts();
        }

        document.getElementById('father_name').value = card.father_name;
        document.getElementById('mother_name').value = card.mother_name;
        document.getElementById('issue_date').value = card.issue_date;
        syncExpiryDateFromIssueDate();
        document.getElementById('photo_url').value = card.photo_url || '';

        resetPhotoFilePicker();
        updateCardModalHeader('edit');
        updatePhotoPreview(card.photo_url || '');
        updatePhotoSourceStatus(card.photo_url || '');
        setIdGeneratorVisibility(false);
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
        const safePhotoUrl = card.photo_url && isValidHttpUrl(card.photo_url)
            ? escapeHtml(card.photo_url)
            : '';
        const safeKhmerName = escapeHtml(card.khmer_name);
        const safeLatinName = escapeHtml(card.latin_name);
        const safeIdNumber = escapeHtml(card.id_number);
        const safeGender = escapeHtml(card.gender);
        const safeNationality = escapeHtml(card.nationality);
        const safePlaceOfBirth = escapeHtml(card.place_of_birth);
        const safePlaceOfBirthProvince = escapeHtml(card.place_of_birth_province || '');
        const safeCurrentAddress = escapeHtml(card.current_address);
        const safeCurrentAddressProvince = escapeHtml(card.current_address_province || '');
        const safeFatherName = escapeHtml(card.father_name);
        const safeMotherName = escapeHtml(card.mother_name);
        
        viewBody.innerHTML = `
            <div class="detail-card">
                <div class="detail-photo">
                    ${safePhotoUrl
                        ? `<img src="${safePhotoUrl}" alt="${safeKhmerName}" onerror="this.parentElement.innerHTML='<div class=\\'no-photo\\'><i class=\\'fas fa-user\\'></i></div>'">`
                        : `<div class="no-photo"><i class="fas fa-user\\'></i></div>`
                    }
                </div>
                <div class="detail-info">
                    <h3>${safeKhmerName}</h3>
                    <p class="latin-name">${safeLatinName}</p>
                    <p><i class="fas fa-id-card"></i> ${safeIdNumber}</p>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>ភេទ</label>
                    <span>${safeGender}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃខែឆ្នាំកំណើត</label>
                    <span>${formatDate(card.date_of_birth)}</span>
                </div>
                <div class="detail-item">
                    <label>សញ្ជាតិ</label>
                    <span>${safeNationality}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃចេញប័ណ្ណ</label>
                    <span>${formatDate(card.issue_date)}</span>
                </div>
                <div class="detail-item full-width">
                    <label>ទីកន្លែងកំណើត</label>
                    <span>${safePlaceOfBirth}${safePlaceOfBirthProvince ? `, ${safePlaceOfBirthProvince}` : ''}</span>
                </div>
                <div class="detail-item full-width">
                    <label>អាសយដ្ឋានបច្ចុប្បន្ន</label>
                    <span>${safeCurrentAddress}${safeCurrentAddressProvince ? `, ${safeCurrentAddressProvince}` : ''}</span>
                </div>
                <div class="detail-item">
                    <label>ឈ្មោះឪពុក</label>
                    <span>${safeFatherName}</span>
                </div>
                <div class="detail-item">
                    <label>ឈ្មោះម្តាយ</label>
                    <span>${safeMotherName}</span>
                </div>
                <div class="detail-item">
                    <label>ថ្ងៃផុតសុពលភាព</label>
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
    installInputProtection();
    installFormValidationAlerts();
    
    // Load initial data
    loadAllCards();
    updateStatistics();
    ensureProvinceDropdownsReady();

    const issueDateInput = document.getElementById('issue_date');
    if (issueDateInput) {
        issueDateInput.addEventListener('input', syncExpiryDateFromIssueDate);
        issueDateInput.addEventListener('change', syncExpiryDateFromIssueDate);
    }
    
    // Form submission
    document.getElementById('card-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        syncExpiryDateFromIssueDate();
        sanitizeCardFormInputs();

        const cardId = document.getElementById('card-id').value;
        const idNumberInput = document.getElementById('id_number');

        if (!cardId && !idNumberInput.value.trim()) {
            await generateIdNumber(true);
        }

        // Build place_of_birth from the POB cascading dropdowns
        const pobVillageEl  = document.getElementById('pob_village');
        const pobCommuneEl  = document.getElementById('pob_commune');
        const pobDistrictEl = document.getElementById('pob_district');
        const pobProvinceEl = document.getElementById('pob_province');
        const pobParts = [
            pobVillageEl.value  || pobVillageEl.options[pobVillageEl.selectedIndex]?.text,
            pobCommuneEl.value  || pobCommuneEl.options[pobCommuneEl.selectedIndex]?.text,
            pobDistrictEl.value || pobDistrictEl.options[pobDistrictEl.selectedIndex]?.text,
            pobProvinceEl.value || pobProvinceEl.options[pobProvinceEl.selectedIndex]?.text
        ].filter(v => v &&
            v !== 'ជ្រើសរើសស្រុក' &&
            v !== 'ជ្រើសរើសស្រុក/ខណ្ឌ' &&
            v !== 'ជ្រើសរើសឃុំ' &&
            v !== 'ជ្រើសរើសឃុំ/សង្កាត់' &&
            v !== 'ជ្រើសរើសភូមិ' &&
            v !== 'ជ្រើសរើសខេត្ត/រាជធានី'
        );
        const placeOfBirth = pobParts.join(', ');

        const currentVillageEl = document.getElementById('current_village');
        const currentCommuneEl = document.getElementById('current_commune');
        const currentDistrictEl = document.getElementById('current_district');
        const currentProvinceEl = document.getElementById('current_province');
        const currentDetailEl = document.getElementById('current_address_detail');
        
        const currentParts = [
            sanitizeMultilineInput(currentDetailEl.value, INPUT_LIMITS.current_address_detail),
            currentVillageEl.value  || currentVillageEl.options[currentVillageEl.selectedIndex]?.text,
            currentCommuneEl.value  || currentCommuneEl.options[currentCommuneEl.selectedIndex]?.text,
            currentDistrictEl.value || currentDistrictEl.options[currentDistrictEl.selectedIndex]?.text,
            currentProvinceEl.value || currentProvinceEl.options[currentProvinceEl.selectedIndex]?.text
        ].filter(v => v && 
            v !== 'ជ្រើសរើសស្រុក/ខណ្ឌ' && 
            v !== 'ជ្រើសរើសឃុំ/សង្កាត់' && 
            v !== 'ជ្រើសរើសភូមិ' && 
            v !== 'ជ្រើសរើសខេត្ត/រាជធានី'
        );
        const currentAddress = currentParts.join(', ');

        const cardData = {
            id_number: sanitizeIdNumberInput(document.getElementById('id_number').value, INPUT_LIMITS.id_number),
            khmer_name: sanitizeKhmerOnlyInput(document.getElementById('khmer_name').value, INPUT_LIMITS.khmer_name),
            latin_name: sanitizeLatinNameInput(document.getElementById('latin_name').value, INPUT_LIMITS.latin_name),
            date_of_birth: document.getElementById('date_of_birth').value,
            gender: document.getElementById('gender').value,
            nationality: sanitizeSingleLineInput(document.getElementById('nationality').value, 50),
            place_of_birth: placeOfBirth,
            place_of_birth_province: pobProvinceEl.value,
            current_address: currentAddress,
            current_address_province: currentProvinceEl.value,
            father_name: sanitizeKhmerOnlyInput(document.getElementById('father_name').value, INPUT_LIMITS.father_name),
            mother_name: sanitizeKhmerOnlyInput(document.getElementById('mother_name').value, INPUT_LIMITS.mother_name),
            issue_date: document.getElementById('issue_date').value,
            expiry_date: document.getElementById('expiry_date').value,
            photo_url: sanitizeSingleLineInput(document.getElementById('photo_url').value, INPUT_LIMITS.photo_url)
        };

        idNumberInput.value = cardData.id_number;
        document.getElementById('khmer_name').value = cardData.khmer_name;
        document.getElementById('latin_name').value = cardData.latin_name;
        document.getElementById('father_name').value = cardData.father_name;
        document.getElementById('mother_name').value = cardData.mother_name;
        document.getElementById('issue_date').value = cardData.issue_date;
        document.getElementById('expiry_date').value = cardData.expiry_date;
        document.getElementById('photo_url').value = cardData.photo_url;
        currentDetailEl.value = sanitizeMultilineInput(currentDetailEl.value, INPUT_LIMITS.current_address_detail);

        const nativeValidationMessage = validateNativeCardForm(this);
        if (nativeValidationMessage) {
            return;
        }

        const validationMessage = validateCardData(cardData, { isEdit: Boolean(cardId) });
        if (validationMessage) {
            showToast(validationMessage, 'error');
            return;
        }

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

    // Current address dropdown event listeners
    document.getElementById('current_province').addEventListener('change', populateCurrentDistricts);
    document.getElementById('current_district').addEventListener('change', populateCurrentCommunes);
    document.getElementById('current_commune').addEventListener('change', populateCurrentVillages);

    // Place of birth dropdown event listeners
    document.getElementById('pob_province').addEventListener('change', populatePobDistricts);
    document.getElementById('pob_district').addEventListener('change', populatePobCommunes);
    document.getElementById('pob_commune').addEventListener('change', populatePobVillages);



    document.getElementById('photo_url').addEventListener('input', function(e) {
        e.target.value = sanitizeSingleLineInput(e.target.value, INPUT_LIMITS.photo_url);
        updatePhotoPreview(e.target.value);
        updatePhotoSourceStatus(e.target.value);
    });
    document.getElementById('choose-photo-btn').addEventListener('click', function() {
        document.getElementById('photo_file').click();
    });
    document.getElementById('clear-photo-btn').addEventListener('click', function() {
        clearPhotoSelection();
    });
    document.getElementById('photo_file').addEventListener('change', handleLocalPhotoSelection);
    
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
