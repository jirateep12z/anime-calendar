import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../services/theme-store';

export const UseAppDispatch = useDispatch.withTypes<AppDispatch>();
export const UseAppSelector = useSelector.withTypes<RootState>();
