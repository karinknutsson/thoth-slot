export class AudioController {
  private static readonly SOUND_POOL_SIZE = 5;

  private readonly tracks: HTMLAudioElement[];
  private readonly soundPools: Map<string, HTMLAudioElement[]>;
  private readonly soundPoolIndex = new Map<string, number>();
  private soundVolume = 1;
  private currentTrackIndex = 0;

  constructor(
    tracks: HTMLAudioElement[],
    sounds: Record<string, HTMLAudioElement>,
  ) {
    this.tracks = tracks;
    this.soundPools = new Map(
      Object.entries(sounds).map(([name, sound]) => [
        name,
        AudioController.createSoundPool(sound),
      ]),
    );
    for (const track of this.tracks) {
      track.loop = false;
      track.addEventListener("ended", () => this.playNextTrack());
    }
  }

  // Several instances of the same sound, so overlapping plays (e.g. one per
  // reel settling in quick succession) don't cut each other off by restarting
  // a single shared element
  private static createSoundPool(source: HTMLAudioElement): HTMLAudioElement[] {
    return Array.from({ length: AudioController.SOUND_POOL_SIZE }, () => {
      const clone = source.cloneNode(true) as HTMLAudioElement;
      clone.style.display = "none";
      document.body.appendChild(clone);
      return clone;
    });
  }

  private get currentTrack(): HTMLAudioElement {
    return this.tracks[this.currentTrackIndex];
  }

  private playNextTrack(): void {
    this.currentTrackIndex =
      (this.currentTrackIndex + 1) % this.tracks.length;
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
    const pool = this.soundPools.get(name);
    if (!pool) return;

    const index = this.soundPoolIndex.get(name) ?? 0;
    this.soundPoolIndex.set(name, (index + 1) % pool.length);

    const sound = pool[index];
    sound.volume = this.soundVolume;
    sound.currentTime = 0;
    void sound.play().catch(() => {});
  }
}
