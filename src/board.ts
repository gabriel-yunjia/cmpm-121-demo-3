export interface Cell {
  x: number;
  y: number;
}

interface Coins {
  coord: Cell;
  serial: number;
}

export class Board {
  private oldCells: Map<string, Cell>;

  constructor() {
    this.oldCells = new Map();
  }

  getGridCell(x: number, y: number): Cell {
    const i = Math.round(x * 10000);
    const j = Math.round(y * 10000);
    const key = `${i}_${j}`;
    if (this.oldCells.has(key)) {
      return this.oldCells.get(key)!;
    } else {
      const newCell: Cell = { x: i, y: j };
      this.oldCells.set(key, newCell);
      return newCell;
    }
  }

  printBoard() {
    console.log(this.oldCells);
  }
}

export class Cache {
  coinList: Coins[];
  description: string;
  cell: Cell;

  constructor(cell: Cell) {
    this.description = `${cell.x}_${cell.y}`;
    this.cell = cell;
    this.coinList = [];
  }
  addCoin() {
    const Serial: number =
      this.coinList.length > 0
        ? this.coinList[this.coinList.length - 1].serial + 1
        : 0;
    this.coinList.push({ coord: this.cell, serial: Serial });
  }

  format(): string[] {
    const res: string[] = [];
    this.coinList.map((coin) => {
      res.push(
        `${coin.coord.x.toFixed(4)}:${coin.coord.y.toFixed(4)}#${coin.serial}`
      );
    });
    return res;
  }

  toMomento(): string {
    return this.description;
  }

  fromMomento(momento: string) {
    this.description = momento;
  }
}
