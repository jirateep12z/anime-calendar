export interface AppLoadingState {
  readonly is_loading: boolean;
  /** Null for the initial page load, which is timed from the boundary mount. */
  readonly started_at: number | null;
}
