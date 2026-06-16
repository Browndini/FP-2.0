import { MINI_GAMES } from "@/lib/constants/game";
import type { ReflexDashResult } from "../types";

export async function launchReflexDash(
  parent: HTMLDivElement,
  onComplete: (result: ReflexDashResult) => void
) {
  const Phaser = (await import("phaser")).default;
  const durationSeconds = MINI_GAMES["reflex-dash"].durationSeconds;

  class ReflexDashScene extends Phaser.Scene {
    private score = 0;
    private timeLeft = durationSeconds;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private ended = false;
    private startedAt = 0;

    constructor() {
      super("ReflexDash");
    }

    create() {
      this.startedAt = Date.now();
      const { width, height } = this.scale;

      this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

      this.scoreText = this.add.text(16, 16, "Score: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#ffffff",
      });

      this.timerText = this.add
        .text(width - 16, 16, `Time: ${this.timeLeft}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "20px",
          color: "#ffffff",
        })
        .setOrigin(1, 0);

      this.add
        .text(width / 2, height / 2 - 60, "Tap the orange targets!", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
        })
        .setOrigin(0.5);

      this.time.addEvent({
        delay: 1000,
        repeat: durationSeconds - 1,
        callback: () => {
          this.timeLeft -= 1;
          this.timerText.setText(`Time: ${this.timeLeft}`);
          if (this.timeLeft <= 0) {
            this.endGame();
          }
        },
      });

      this.scheduleTarget();
    }

    scheduleTarget() {
      if (this.ended || this.timeLeft <= 0) return;

      const delay = Phaser.Math.Between(650, 1300);
      this.time.delayedCall(delay, () => {
        this.spawnTarget();
        this.scheduleTarget();
      });
    }

    spawnTarget() {
      if (this.ended || this.timeLeft <= 0) return;

      const { width, height } = this.scale;
      const padding = 48;
      const x = Phaser.Math.Between(padding, width - padding);
      const y = Phaser.Math.Between(padding + 48, height - padding);

      const target = this.add
        .circle(x, y, 26, 0xf97316)
        .setStrokeStyle(3, 0xfdba74)
        .setInteractive({ useHandCursor: true });

      const fadeTimer = this.time.delayedCall(1100, () => {
        target.destroy();
      });

      target.on("pointerdown", () => {
        if (this.ended) return;
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
        fadeTimer.remove(false);
        target.destroy();
      });
    }

    endGame() {
      if (this.ended) return;
      this.ended = true;

      onComplete({
        score: this.score,
        hits: this.score,
        durationMs: Date.now() - this.startedAt,
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 480,
    backgroundColor: "#1a1a2e",
    scene: ReflexDashScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
