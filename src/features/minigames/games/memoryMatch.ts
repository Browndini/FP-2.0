import { MINI_GAMES, computeMemoryMatchScore } from "@/lib/constants/game";
import type { MemoryMatchResult } from "../types";

const PAIR_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const PAIR_COLORS = [
  0xf97316, 0x3b82f6, 0x22c55e, 0xa855f7, 0xef4444, 0x14b8a6, 0xeab308, 0xec4899,
];

interface Card {
  index: number;
  pairId: number;
  container: import("phaser").GameObjects.Container;
  face: import("phaser").GameObjects.Rectangle;
  label: import("phaser").GameObjects.Text;
  revealed: boolean;
  matched: boolean;
}

export async function launchMemoryMatch(
  parent: HTMLDivElement,
  onComplete: (result: MemoryMatchResult) => void
) {
  const Phaser = (await import("phaser")).default;
  const pairCount = MINI_GAMES["memory-match"].pairCount;

  class MemoryMatchScene extends Phaser.Scene {
    private cards: Card[] = [];
    private firstPick: Card | null = null;
    private moves = 0;
    private pairsFound = 0;
    private locked = false;
    private ended = false;
    private startedAt = 0;
    private movesText!: Phaser.GameObjects.Text;

    constructor() {
      super("MemoryMatch");
    }

    create() {
      this.startedAt = Date.now();
      const { width } = this.scale;

      this.add.rectangle(width / 2, 240, width, 480, 0x111827);

      this.movesText = this.add.text(16, 16, "Moves: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#ffffff",
      });

      this.add
        .text(width / 2, 48, "Match all pairs", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
        })
        .setOrigin(0.5);

      const deck = Phaser.Utils.Array.Shuffle([
        ...Array.from({ length: pairCount }, (_, i) => i),
        ...Array.from({ length: pairCount }, (_, i) => i),
      ]);

      const cols = 4;
      const cardW = 120;
      const cardH = 90;
      const gap = 12;
      const gridW = cols * cardW + (cols - 1) * gap;
      const startX = (width - gridW) / 2 + cardW / 2;
      const startY = 130 + cardH / 2;

      deck.forEach((pairId, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        const container = this.add.container(x, y);
        const back = this.add
          .rectangle(0, 0, cardW, cardH, 0x334155)
          .setStrokeStyle(2, 0x64748b);
        const face = this.add
          .rectangle(0, 0, cardW, cardH, PAIR_COLORS[pairId])
          .setStrokeStyle(2, 0xffffff)
          .setVisible(false);
        const label = this.add
          .text(0, 0, PAIR_LABELS[pairId], {
            fontFamily: "system-ui, sans-serif",
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setVisible(false);

        container.add([back, face, label]);
        container.setSize(cardW, cardH);
        container.setInteractive(
          new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
          Phaser.Geom.Rectangle.Contains
        );

        const card: Card = {
          index,
          pairId,
          container,
          face,
          label,
          revealed: false,
          matched: false,
        };

        container.on("pointerdown", () => this.onCardClick(card));
        this.cards.push(card);
      });
    }

    onCardClick(card: Card) {
      if (this.locked || this.ended || card.matched || card.revealed) return;

      this.revealCard(card);

      if (!this.firstPick) {
        this.firstPick = card;
        return;
      }

      this.moves += 1;
      this.movesText.setText(`Moves: ${this.moves}`);

      if (this.firstPick.pairId === card.pairId) {
        this.firstPick.matched = true;
        card.matched = true;
        this.pairsFound += 1;
        this.firstPick = null;

        if (this.pairsFound >= pairCount) {
          this.endGame();
        }
        return;
      }

      this.locked = true;
      const first = this.firstPick;
      this.firstPick = null;

      this.time.delayedCall(700, () => {
        this.hideCard(first);
        this.hideCard(card);
        this.locked = false;
      });
    }

    revealCard(card: Card) {
      card.revealed = true;
      card.face.setVisible(true);
      card.label.setVisible(true);
    }

    hideCard(card: Card) {
      card.revealed = false;
      card.face.setVisible(false);
      card.label.setVisible(false);
    }

    endGame() {
      if (this.ended) return;
      this.ended = true;

      const score = computeMemoryMatchScore(this.pairsFound, this.moves);
      onComplete({
        score,
        pairs: this.pairsFound,
        moves: this.moves,
        durationMs: Date.now() - this.startedAt,
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 480,
    backgroundColor: "#111827",
    scene: MemoryMatchScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
