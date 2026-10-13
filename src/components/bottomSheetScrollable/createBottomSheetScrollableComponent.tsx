import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  SCROLLABLE_DECELERATION_RATE_MAPPER,
  SCROLLABLE_STATUS,
  type SCROLLABLE_TYPE,
} from '../../constants';
import { BottomSheetDraggableContext } from '../../contexts/gesture';
import {
  useBottomSheetContentContainerStyle,
  useBottomSheetInternal,
  useScrollableSetter,
  useScrollHandler,
  useStableCallback,
} from '../../hooks';
import { ScrollableContainer } from './ScrollableContainer';
import { useBottomSheetContentSizeSetter } from './useBottomSheetContentSizeSetter';

const notifyScrollViewLayout = (
  onLayout: ViewProps['onLayout'] | SharedValue<ViewProps['onLayout']>,
  event: LayoutChangeEvent
) => {
  const callback = typeof onLayout === 'function' ? onLayout : onLayout?.get();
  callback?.(event);
};

export function createBottomSheetScrollableComponent<T, P>(
  type: SCROLLABLE_TYPE,
  // biome-ignore lint: to be addressed!
  ScrollableComponent: any
) {
  return forwardRef<T, P>((props, ref) => {
    //#region props
    const {
      // hooks
      focusHook,
      scrollEventsHandlersHook,
      // props
      enableFooterMarginAdjustment = false,
      overScrollMode = 'never',
      keyboardDismissMode = 'interactive',
      showsVerticalScrollIndicator = true,
      contentContainerStyle: _providedContentContainerStyle,
      refreshing,
      onRefresh,
      progressViewOffset,
      refreshControl,
      // events
      onLayout,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onContentSizeChange,
      ...rest
      // biome-ignore lint: to be addressed!
    }: any = props;
    //#endregion

    //#region hooks
    const draggableGesture = useContext(BottomSheetDraggableContext);
    const { scrollableRef, scrollableContentOffsetY, scrollHandler } =
      useScrollHandler(
        scrollEventsHandlersHook,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag
      );
    const {
      animatedIndex,
      animatedScrollableStatus: animatedScrollableState,
      enableContentPanningGesture,
    } = useBottomSheetInternal();
    const { setContentSize } = useBottomSheetContentSizeSetter();
    const lastLayoutEvent = useRef<LayoutChangeEvent | null>(null);
    //#endregion

    if (!draggableGesture && enableContentPanningGesture) {
      throw new Error("'Scrollable' cannot be used out of the BottomSheet!");
    }

    //#region variables
    const scrollableAnimatedProps = useAnimatedProps(
      () => ({
        decelerationRate:
          SCROLLABLE_DECELERATION_RATE_MAPPER[animatedScrollableState.get()],
        showsVerticalScrollIndicator: showsVerticalScrollIndicator
          ? animatedScrollableState.get() === SCROLLABLE_STATUS.UNLOCKED
          : showsVerticalScrollIndicator,
      }),
      [animatedScrollableState, showsVerticalScrollIndicator]
    );

    const scrollableGesture = useMemo(
      () =>
        draggableGesture
          ? Gesture.Native()
              // @ts-ignore
              .simultaneousWithExternalGesture(draggableGesture)
              .shouldCancelWhenOutside(false)
          : undefined,
      [draggableGesture]
    );
    //#endregion

    //#region callbacks
    const handleLayout = useStableCallback((event: LayoutChangeEvent) => {
      event.persist();
      lastLayoutEvent.current = event;
      notifyScrollViewLayout(onLayout, event);
    });
    const refreshLayout = useStableCallback(() => {
      // Moving the sheet changes its window position without a native layout event.
      // Let consumers refresh their measurements when it reaches a snap point.
      if (lastLayoutEvent.current) {
        notifyScrollViewLayout(onLayout, lastLayoutEvent.current);
      }
    });

    const handleContentSizeChange = useStableCallback(
      (contentWidth: number, contentHeight: number) => {
        setContentSize(contentHeight);
        if (onContentSizeChange) {
          onContentSizeChange(contentWidth, contentHeight);
        }
      }
    );
    //#endregion

    //#region styles
    const contentContainerStyle = useBottomSheetContentContainerStyle(
      enableFooterMarginAdjustment,
      _providedContentContainerStyle
    );
    //#endregion

    //#region effects
    useAnimatedReaction(
      () => animatedIndex.get(),
      (index, previous) => {
        if (index !== previous && index >= 0 && Number.isInteger(index)) {
          scheduleOnRN(refreshLayout);
        }
      },
      [refreshLayout]
    );

    // @ts-ignore
    useImperativeHandle(ref, () => scrollableRef.current);
    useScrollableSetter(
      scrollableRef,
      type,
      scrollableContentOffsetY,
      onRefresh !== undefined,
      focusHook
    );
    //#endregion

    //#region render
    return (
      <ScrollableContainer
        ref={scrollableRef}
        nativeGesture={scrollableGesture}
        animatedProps={scrollableAnimatedProps}
        overScrollMode={overScrollMode}
        keyboardDismissMode={keyboardDismissMode}
        refreshing={refreshing}
        scrollEventThrottle={16}
        progressViewOffset={progressViewOffset}
        contentContainerStyle={contentContainerStyle}
        onRefresh={onRefresh}
        onScroll={scrollHandler}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        setContentSize={setContentSize}
        ScrollableComponent={ScrollableComponent}
        refreshControl={refreshControl}
        {...rest}
      />
    );
    //#endregion
  });
}
