import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";

interface SliderRow {
  track: Graphics;
  handle: Graphics;
  trackWidth: number;
  volume: number;
  dragging: boolean;
  onChange: (volume: number) => void;
}

export class AudioView extends Container {
  private static readonly MARGIN = 16;
  private static readonly PADDING = 24;
  private static readonly ITEM_GAP = 24;
  private static readonly FONT_SIZE = 18;
  private static readonly LABEL_TRACK_GAP = 14;
  private static readonly TRACK_WIDTH = 140;
  private static readonly TRACK_HEIGHT = 4;
  private static readonly HANDLE_RADIUS = 8;
  private static readonly TRACK_COLOR = 0xffffff;
  private static readonly FILL_COLOR = 0xfbd554;
  private static readonly HANDLE_COLOR = 0xfbd554;
  private static readonly INITIAL_VOLUME = 1;

  private readonly background: Graphics;
  private readonly rows: SliderRow[] = [];

  constructor(
    onMusicVolumeChange: (volume: number) => void,
    onSoundVolumeChange: (volume: number) => void,
  ) {
    super();

    this.background = new Graphics();
    this.addChild(this.background);

    let y = AudioView.PADDING;
    let maxRowWidth = 0;

    const rowDefs: [string, (volume: number) => void][] = [
      ["Music Volume", onMusicVolumeChange],
      ["Sound Volume", onSoundVolumeChange],
    ];

    for (const [label, onChange] of rowDefs) {
      const rowWidth = this.addRow(label, y, onChange);
      maxRowWidth = Math.max(maxRowWidth, rowWidth);
      y +=
        AudioView.FONT_SIZE +
        AudioView.LABEL_TRACK_GAP +
        AudioView.HANDLE_RADIUS * 2 +
        AudioView.ITEM_GAP;
    }

    const width = maxRowWidth + AudioView.PADDING * 2;
    const height = y - AudioView.ITEM_GAP + AudioView.PADDING;

    this.background.rect(0, 0, width, height).fill({ color: 0x000000 });

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private addRow(
    label: string,
    y: number,
    onChange: (volume: number) => void,
  ): number {
    const text = new Text({
      text: label,
      style: {
        fill: AudioView.TRACK_COLOR,
        fontSize: AudioView.FONT_SIZE,
        fontFamily: "Inter",
        fontWeight: "600",
      },
    });
    text.position.set(AudioView.PADDING, y);
    this.addChild(text);

    const trackY =
      y + AudioView.FONT_SIZE + AudioView.LABEL_TRACK_GAP + AudioView.HANDLE_RADIUS;

    const track = new Graphics();
    track.position.set(AudioView.PADDING, trackY);

    const handle = new Graphics();
    handle.position.set(AudioView.PADDING, trackY);

    const row: SliderRow = {
      track,
      handle,
      trackWidth: AudioView.TRACK_WIDTH,
      volume: AudioView.INITIAL_VOLUME,
      dragging: false,
      onChange,
    };
    this.rows.push(row);
    this.drawSlider(row);

    // Widen the hit area vertically so small pointer drift while dragging
    // doesn't drop the pointer off the thin track
    track.eventMode = "static";
    track.cursor = "pointer";
    track.hitArea = new Rectangle(
      0,
      -AudioView.HANDLE_RADIUS,
      row.trackWidth,
      AudioView.HANDLE_RADIUS * 2,
    );
    handle.eventMode = "static";
    handle.cursor = "pointer";

    const startDrag = (event: FederatedPointerEvent) => {
      row.dragging = true;
      this.updateFromPointer(row, event);
    };
    const stopDrag = () => {
      row.dragging = false;
    };
    const moveDrag = (event: FederatedPointerEvent) => {
      if (row.dragging) this.updateFromPointer(row, event);
    };

    track.on("pointerdown", startDrag);
    handle.on("pointerdown", startDrag);
    track.on("globalpointermove", moveDrag);
    handle.on("globalpointermove", moveDrag);
    track.on("pointerup", stopDrag);
    track.on("pointerupoutside", stopDrag);
    handle.on("pointerup", stopDrag);
    handle.on("pointerupoutside", stopDrag);

    this.addChild(track, handle);

    return Math.max(text.width, AudioView.TRACK_WIDTH);
  }

  private updateFromPointer(row: SliderRow, event: FederatedPointerEvent): void {
    const localX = row.track.toLocal(event.global).x;
    const ratio = Math.max(0, Math.min(1, localX / row.trackWidth));
    row.volume = ratio;
    this.drawSlider(row);
    row.onChange(ratio);
  }

  private drawSlider(row: SliderRow): void {
    const fillWidth = row.trackWidth * row.volume;

    row.track
      .clear()
      .rect(0, -AudioView.TRACK_HEIGHT / 2, row.trackWidth, AudioView.TRACK_HEIGHT)
      .fill({ color: AudioView.TRACK_COLOR, alpha: 0.4 })
      .rect(0, -AudioView.TRACK_HEIGHT / 2, fillWidth, AudioView.TRACK_HEIGHT)
      .fill({ color: AudioView.FILL_COLOR });

    row.handle
      .clear()
      .circle(fillWidth, 0, AudioView.HANDLE_RADIUS)
      .fill({ color: AudioView.HANDLE_COLOR });
  }

  private resize(): void {
    this.position.set(AudioView.MARGIN, AudioView.MARGIN);
  }
}
