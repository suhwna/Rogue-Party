export interface PoolStats {
  used: number;
  retained: number;
}

export interface RenderPool<T> {
  begin(): void;
  end(): void;
  stats(): PoolStats;
  trim(maxRetained: number): void;
  next(...args: unknown[]): T;
}
