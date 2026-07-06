import { Container, Sprite, Texture } from "pixi.js";

export class GameView extends Container {
  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;

  public constructor(backgroundTexture: Texture) {
    super();

    this.background = new Sprite(backgroundTexture);
    this.background.anchor.set(0.5);
    this.addChild(this.background);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private resize(): void {
    const scale = Math.max(
      window.innerWidth / this.imageWidth,
      window.innerHeight / this.imageHeight,
    );

    this.background.width = this.imageWidth * scale;
    this.background.height = this.imageHeight * scale;
    this.background.position.set(
      window.innerWidth / 2,
      window.innerHeight / 2,
    );
  }
}
