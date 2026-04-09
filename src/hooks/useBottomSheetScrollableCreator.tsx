import React, { type ReactElement, useCallback } from 'react';
import {
  type BottomSheetScrollableProps,
  BottomSheetScrollView,
} from '../components/bottomSheetScrollable';

type BottomSheetScrollableCreatorConfigs = BottomSheetScrollableProps;

export function useBottomSheetScrollableCreator<T = any>({
  focusHook,
  scrollEventsHandlersHook,
  enableFooterMarginAdjustment,
}: BottomSheetScrollableCreatorConfigs = {}): (
  props: T,
  ref?: never
) => ReactElement<T> {
  return useCallback(
    function createScrollable(
      // @ts-expect-error `data` is passed by third-party list implementations.
      { data: _, ...props }: T,
      ref?: never
    ): ReactElement<T> {
      return (
        <BottomSheetScrollView
          ref={ref}
          {...props}
          focusHook={focusHook}
          scrollEventsHandlersHook={scrollEventsHandlersHook}
          enableFooterMarginAdjustment={enableFooterMarginAdjustment}
        />
      );
    },
    [enableFooterMarginAdjustment, focusHook, scrollEventsHandlersHook]
  );
}
