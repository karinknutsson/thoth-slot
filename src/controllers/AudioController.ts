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

  private get currentTrack(): HTMLAudioElement {
    return this.tracks[this.currentTrackIndex];
  }

  private playNextTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.playWithAutoplayFallback();
  }

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

  setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    for (const track of this.tracks) {
      track.volume = clamped;
    }
  }

  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  get soundVolumeLevel(): number {
    return this.soundVolume;
  }

  play(name: string): void {
    const sound = this.sounds[name];
    if (!sound) return;

    sound.volume = this.soundVolume;
    sound.currentTime = 0;
    void sound.play().catch(() => {});
  }
}
