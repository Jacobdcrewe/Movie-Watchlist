export interface MovieActions {
  myServices: number[];
  onOpen: (id: number) => void;
  onToggleWatched: (id: number, watched: boolean) => void;
  onRemove: (id: number) => void;
}
