import { Container, Graphics, Text } from "pixi.js";
import { cheats } from "../data/cheat-data";

function labelFromKey(key: string): string {
  return key
    .replace(/([A-Z]|\d+)/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

export class CheatView extends Container {
  private static readonly MARGIN = 16;
  private static readonly PADDING = 24;
  private static readonly ITEM_GAP = 16;
  private static readonly FONT_SIZE = 18;
  private static readonly ACTIVE_COLOR = 0xfbd554;
  private static readonly INACTIVE_COLOR = 0xffffff;

  private readonly background: Graphics;
  private readonly items: { key: string; text: Text }[] = [];

  constructor(onSelect: (cheatName: string) => void) {
    super();

    this.background = new Graphics();
    this.addChild(this.background);

    let y = CheatView.PADDING;

    for (const key of Object.keys(cheats)) {
      const label = new Text({
        text: labelFromKey(key),
        style: {
          fill: CheatView.INACTIVE_COLOR,
          fontSize: CheatView.FONT_SIZE,
          fontFamily: "Inter",
          fontWeight: "600",
        },
      });

      label.position.set(CheatView.PADDING, y);
      label.eventMode = "static";
      label.cursor = "pointer";
      label.on("pointertap", () => {
        this.setActive(key);
        onSelect(key);
      });
      this.addChild(label);

      this.items.push({ key, text: label });
      y += label.height + CheatView.ITEM_GAP;
    }

    const width =
      Math.max(...this.items.map((item) => item.text.width)) +
      CheatView.PADDING * 2;
    const height = y - CheatView.ITEM_GAP + CheatView.PADDING;

    this.background.rect(0, 0, width, height).fill({ color: 0x000000 });

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private setActive(key: string): void {
    for (const item of this.items) {
      item.text.style.fill =
        item.key === key ? CheatView.ACTIVE_COLOR : CheatView.INACTIVE_COLOR;
    }
  }

  private resize(): void {
    this.position.set(
      window.innerWidth - this.background.width - CheatView.MARGIN,
      CheatView.MARGIN,
    );
  }
}
