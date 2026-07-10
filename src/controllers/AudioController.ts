export class AudioController {
  private readonly tracks: HTMLAudioElement[];
  private readonly sounds: Record<string, HTMLAudioElement>;
  private soundVolume = 1;
  private currentTrackIndex = 0;

  constructor(
    tracks: HTMLAudioElement[],
    sounds: Record<string, HTMLAudioElement>,
  ) {
    this.tracks = tracks;
    this.sounds = sounds;
    for (const track of this.tracks) {
      track.loop = false;
      track.addEventListener("ended", () => this.playNextTrack());
    }
  }

  // Returns the currently playing track
  private get currentTrack(): HTMLAudioElement {
    return this.tracks[this.currentTrackIndex];
  }

  // Starts playing the current track, and sets up the next track to play
  // when it ends
  private playNextTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.playWithAutoplayFallback();
  }

  // Attempts to play the current track, and if it fails due to autoplay
  // restrictions, start on first user interaction
  playWithAutoplayFallback(): void {
    this.currentTrack.play().catch(() => {
      const start = () => this.currentTrack.play().catch(() => {});
      for (const eventName of ["pointerdown", "keydown", "touchstart"]) {
        document.addEventListener(eventName, start, {
          once: true,
          capture: true,
        });
      }
    });
  }

  // Sets the volume for all music tracks, clamped between 0 and 1
  setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    for (const track of this.tracks) {
      track.volume = clamped;
    }
  }

  // Sets the volume for sound effects, clamped between 0 and 1
  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  // Plays a one-shot sound effect by name, if it exists, at the current
  // sound volume
  play(name: string): void {
    const sound = this.sounds[name];
    if (!sound) return;

    sound.volume = this.soundVolume;
    sound.currentTime = 0;
    void sound.play().catch(() => {});
  }
}
