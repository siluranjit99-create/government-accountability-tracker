// submit.js

// Default map center - Kathmandu. Adjust to your city if useful for the demo.
const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.3240;

let selectedCategory = 'Electricity';
let selectedLat = DEFAULT_LAT;
let selectedLng = DEFAULT_LNG;
let photoDataUrl = null;
let marker = null;
let map = null;

function initMap() {
    map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        selectedLat = pos.lat;
        selectedLng = pos.lng;
    });

    map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
    });
}

function initCategoryPicker() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
        });
    });
}

function initPhotoUpload() {
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('photo-input');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => {
        if (input.files[0]) handleFile(input.files[0]);
    });

    function handleFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('Photo must be under 10MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            photoDataUrl = e.target.result;
            zone.classList.add('has-image');
            zone.innerHTML = `<img class="preview" src="${photoDataUrl}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function initLocationButton() {
    document.getElementById('use-location-btn').addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not available in this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                selectedLat = pos.coords.latitude;
                selectedLng = pos.coords.longitude;
                marker.setLatLng([selectedLat, selectedLng]);
                map.setView([selectedLat, selectedLng], 15);
            },
            () => alert('Could not get your location.')
        );
    });
}

function showError(msg) {
    const el = document.getElementById('form-error');
    el.textContent = msg;
    el.classList.remove('hidden');
}
function clearError() {
    document.getElementById('form-error').classList.add('hidden');
}

async function handleSubmit(e) {
    e.preventDefault();
    clearError();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!title) {
        showError('Please enter a title for the issue.');
        return;
    }

    const btn = document.getElementById('post-btn');
    btn.disabled = true;
    btn.textContent = 'Posting...';

    try {
        window.requireLogin(async () => {
            await window.issueStore.postIssue({
                title,
                description,
                category: selectedCategory,
                photo_url: photoDataUrl,
                lat: selectedLat,
                lng: selectedLng,
            });
            window.location.href = 'index.html';
        });
    } catch (err) {
        showError('Could not post this issue. Is the backend running?');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Post issue <span class="material-symbols-outlined">send</span>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initCategoryPicker();
    initPhotoUpload();
    initLocationButton();
    document.getElementById('issueForm').addEventListener('submit', handleSubmit);
});
