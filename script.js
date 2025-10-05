// Shimmering stars generation with movement and shooting stars
function createStars() {
  const starsContainer = document.querySelector('.stars');
  for (let i = 0; i < 200; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.width = `${Math.random() * 2 + 1}px`;
    star.style.height = star.style.width;
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    star.style.setProperty('--rand-x', Math.random());
    star.style.setProperty('--rand-y', Math.random());
    starsContainer.appendChild(star);
  }

  // Add 5-10 shooting stars
  for (let i = 0; i < 8; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.classList.add('shooting-star');
    const startX = `${Math.random() * 100 - 50}vw`; // Random start
    const startY = `${Math.random() * 100 - 50}vh`;
    const endX = `${startX + (Math.random() * 200 - 100)}vw`; // Diagonal streak
    const endY = `${startY + (Math.random() * 200 - 100)}vh`;
    shootingStar.style.setProperty('--start-x', startX);
    shootingStar.style.setProperty('--start-y', startY);
    shootingStar.style.setProperty('--end-x', endX);
    shootingStar.style.setProperty('--end-y', endY);
    shootingStar.style.setProperty('--delay', Math.random() * 10); // Random delay
    starsContainer.appendChild(shootingStar);
  }
}
createStars();

// Scroll-based planet rotation, progressive zoom, and section activation
const planet = document.querySelector('.planet');
const planetImg = document.querySelector('.planet img');
const sections = document.querySelectorAll('.section');
let lastScrollTop = 0;
let rotation = 0; // Current rotation angle
let currentSectionIndex = 0;

// Predefined target zoom configs for each section
const zoomConfigs = [
  { scale: 1, origin: '50% 50%', offsetX: 0, offsetY: 0 }, // Section 1: Center, no zoom
  { scale: 1, origin: '50% 50%', offsetX: 0, offsetY: 0 }, // Section 2: Focus purple side (left)
  { scale: 1, origin: '50% 50%', offsetX: 0, offsetY: 0 }, // Section 3: Focus green side (right)
  { scale: 1, origin: '50% 50%', offsetX: 0, offsetY: 0 } // Section 4: Focus bottom divide
];

window.addEventListener('scroll', (e) => {
  const scrollTop = window.scrollY;
  const scrollDelta = scrollTop - lastScrollTop;
  const vh = window.innerHeight;
  const totalScroll = scrollTop / vh; // Fractional section position (e.g., 1.3 = 30% into section 2)
  const sectionIndex = Math.floor(totalScroll);
  const progressInSection = totalScroll - sectionIndex; // 0 to 1 progress within current section

  // Rotate based on scroll delta
  rotation += scrollDelta * 0.1;

  // Interpolate zoom progressively based on progress in section
  const currentConfig = zoomConfigs[sectionIndex] || zoomConfigs[0];
  const nextConfig = zoomConfigs[sectionIndex + 1] || currentConfig; // Next or stay

  // Linear interpolation (lerp) for smooth transition
  const lerp = (a, b, t) => a + (b - a) * t;
  const scale = lerp(1, currentConfig.scale, Math.min(progressInSection * 2, 1)); // Zoom in during first half of section
  const offsetX = lerp(0, currentConfig.offsetX, progressInSection);
  const offsetY = lerp(0, currentConfig.offsetY, progressInSection);
  const originX = lerp(50, parseFloat(currentConfig.origin.split(' ')[0]), progressInSection);
  const originY = lerp(50, parseFloat(currentConfig.origin.split(' ')[1]), progressInSection);

  planetImg.style.transformOrigin = `${originX}% ${originY}%`;
  planet.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale}) rotate(${rotation}deg)`;

  // Activate sections
  sections.forEach((section, index) => {
    const sectionTop = index * vh;
    if (scrollTop >= sectionTop && scrollTop < sectionTop + vh) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  currentSectionIndex = sectionIndex;
  lastScrollTop = scrollTop;
});

// Initial setup
sections[0].classList.add('active');
planet.style.transform = `translate(-50%, -50%) scale(1) rotate(0deg)`;
planetImg.style.transformOrigin = '50% 50%';