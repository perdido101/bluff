const sounds = {
  cardPlace: new Audio('/sounds/card-place.mp3'),
  cardFlip: new Audio('/sounds/card-flip.mp3'),
  challenge: new Audio('/sounds/challenge.mp3'),
  win: new Audio('/sounds/win.mp3'),
  lose: new Audio('/sounds/lose.mp3')
};

export const soundService = {
  play(sound: keyof typeof sounds) {
    sounds[sound].currentTime = 0;
    sounds[sound].play().catch(() => {
      // Ignore autoplay errors
    });
  }
}; 