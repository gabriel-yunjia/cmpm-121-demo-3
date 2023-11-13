interface Cell {
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
    const i = x;
    const j = y;
    const key = `${i.toFixed(4)}_${j.toFixed(4)}`;
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

  constructor(cell: Cell) {
    this.description = `${cell.x}_${cell.y}`;
    this.coinList = [];
  }

  addCoin(cell: Cell) {
    const curSerial: number =
      this.coinList.length > 0
        ? this.coinList[this.coinList.length - 1].serial + 1
        : 0;
    this.coinList.push({ coord: cell, serial: curSerial });
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
}
