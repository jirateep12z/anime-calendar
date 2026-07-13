import 'server-only';

export {
  BookmarkRepositoryError,
  ReadBookmarkCount,
  ReadBookmarkPage,
  WriteBookmarkState
} from './server/bookmark-repository';
export type { BookmarkPage, BookmarkState } from './server/bookmark-repository';
export {
  BookmarkMutationSchema,
  BookmarkQuerySchema,
  BookmarkRouteParameterSchema
} from './validation/bookmark-api-schema';
export type { BookmarkMutationInput } from './validation/bookmark-api-schema';
