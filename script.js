// Custom cursor — smooth interpolated movement
const cursor = document.getElementById('cursor');
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let dx = mx, dy = my;   // dot's current interpolated position
let rx = mx, ry = my;   // ring's current interpolated position
let hasMoved = false;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (!hasMoved) {
    // snap on first move so the cursor doesn't drift in from center
    dx = rx = mx; dy = ry = my;
    hasMoved = true;
    cursor.style.opacity = '1';
    ring.style.opacity = '0.6';
  }
});

document.addEventListener('mouseleave', () => {
  cursor.style.opacity = '0';
  ring.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  if (hasMoved) { cursor.style.opacity = '1'; ring.style.opacity = '0.6'; }
});

// Hover feedback on anything clickable
const interactiveSelector = 'a, button, .dept-item, .service-card, .doctor-card, [onclick]';
document.addEventListener('mouseover', e => {
  if (e.target.closest(interactiveSelector)) ring.classList.add('is-active');
});
document.addEventListener('mouseout', e => {
  if (e.target.closest(interactiveSelector)) ring.classList.remove('is-active');
});

if (reduceMotion) {
  // Respect reduced-motion: snap instead of animate, skip the trailing loop
  document.addEventListener('mousemove', e => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    ring.style.transform = `translate(${e.clientX - 17}px, ${e.clientY - 17}px)`;
  });
} else {
  // Two easing speeds on the same loop: dot tracks tightly, ring trails softly.
  // Both are interpolated (never snapped) for a consistently smooth feel.
  function animCursor() {
    dx += (mx - dx) * 0.35;
    dy += (my - dy) * 0.35;
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;

    cursor.style.transform = `translate(${dx}px, ${dy}px)`;
    ring.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;

    requestAnimationFrame(animCursor);
  }
  animCursor();
}

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => obs.observe(el));

// ── BOOKING MODAL ──────────────────────────────────────────
// CONFIG: set your clinic's WhatsApp number (with country code, no + or spaces)
const CLINIC_WHATSAPP_NUMBER = '919876543210'; // <-- replace with your real number

const bookingOverlay = document.getElementById('bookingOverlay');
const bookingForm = document.getElementById('bookingForm');
const formView = document.getElementById('formView');
const successView = document.getElementById('successView');
const errorView = document.getElementById('errorView');
const submitBtn = document.getElementById('submitBtn');

function openBookingModal() {
  formView.style.display = 'block';
  successView.style.display = 'none';
  errorView.style.display = 'none';
  bookingForm.reset();
  bookingOverlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  updateWhatsappLinks();
}

function closeBookingModal() {
  bookingOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

// Build a prefilled WhatsApp message from whatever the visitor has typed so far
function updateWhatsappLinks() {
  const name = bookingForm.name.value || '[Your Name]';
  const phone = bookingForm.phone.value || '[Your Phone]';
  const dept = bookingForm.department.value || '[Department]';
  const date = bookingForm.preferred_date.value || '[Preferred Date]';
  const msg = bookingForm.message.value || '';

  const text = `Hello, I'd like to book an appointment.%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0ADepartment: ${encodeURIComponent(dept)}%0APreferred Date: ${encodeURIComponent(date)}${msg ? '%0ANote: ' + encodeURIComponent(msg) : ''}`;
  const url = `https://wa.me/${CLINIC_WHATSAPP_NUMBER}?text=${text}`;

  document.getElementById('whatsappLink').href = url;
  document.getElementById('whatsappLinkError').href = url;
}

// Keep WhatsApp link in sync as the visitor fills the form
['name', 'phone', 'department', 'preferred_date', 'message'].forEach(field => {
  const el = bookingForm.elements[field];
  if (el) el.addEventListener('input', updateWhatsappLinks);
});

// Submit the form to Formspree without leaving the page
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch(bookingForm.action, {
      method: 'POST',
      body: new FormData(bookingForm),
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      formView.style.display = 'none';
      successView.style.display = 'block';
    } else {
      formView.style.display = 'none';
      errorView.style.display = 'block';
    }
  } catch (err) {
    formView.style.display = 'none';
    errorView.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Request';
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && bookingOverlay.classList.contains('is-open')) closeBookingModal();
});