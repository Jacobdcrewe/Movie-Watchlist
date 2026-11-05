export interface MovieActions {
  /** View-only access: hide every control that changes the list. */
  readOnly: boolean;
  myServices: number[];
  onOpen: (id: number) => void;
  onToggleWatched: (id: number, watched: boolean) => void;
  onRemove: (id: number) => void;
}
