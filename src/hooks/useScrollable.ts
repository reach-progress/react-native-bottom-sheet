import { type RefObject, useCallback, useRef } from 'react';
import type { NodeHandle } from 'react-native';
import {
  type SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {
  SCROLLABLE_STATUS,
  SCROLLABLE_TYPE,
  SHEET_STATE,
} from '../constants';
import type {
  KeyboardState,
  Scrollable,
  ScrollableRef,
  ScrollableState,
} from '../types';
import { findNodeHandle } from '../utilities';

export const useScrollable = (
  enableContentPanningGesture: boolean,
  animatedSheetState: SharedValue<SHEET_STATE>,
  animatedKeyboardState: SharedValue<KeyboardState>
) => {
  //#region refs
  const scrollableRef = useRef<ScrollableRef>(null);
  const previousScrollableRef = useRef<ScrollableRef>(null);
  //#endregion

  //#region variables
  const state = useSharedValue<ScrollableState>({
    type: SCROLLABLE_TYPE.UNDETERMINED,
    contentOffsetY: 0,
    refreshable: false,
  });
  const status = useDerivedValue<SCROLLABLE_STATUS>(() => {
    /**
     * if user had disabled content panning gesture, then we unlock
     * the scrollable state.
     */
    if (!enableContentPanningGesture) {
      return SCROLLABLE_STATUS.UNLOCKED;
    }

    /**
     * if sheet state is fill parent, then unlock scrolling
     */
    if (animatedSheetState.value === SHEET_STATE.FILL_PARENT) {
      return SCROLLABLE_STATUS.UNLOCKED;
    }

    /**
     * if sheet state is extended, then unlock scrolling
     */
    if (animatedSheetState.value === SHEET_STATE.EXTENDED) {
      return SCROLLABLE_STATUS.UNLOCKED;
    }

    /**
     * Unlock as soon as a bottom sheet input receives focus. Android only
     * reports the keyboard after it is shown, which is too late for consumers
     * that scroll alongside the keyboard animation.
     */
    if (animatedKeyboardState.get().target !== undefined) {
      return SCROLLABLE_STATUS.UNLOCKED;
    }

    return SCROLLABLE_STATUS.LOCKED;
  }, [
    enableContentPanningGesture,
    animatedSheetState,
    animatedKeyboardState,
    state,
  ]);
  //#endregion

  //#region callbacks
  const setScrollableRef = useCallback((ref: ScrollableRef) => {
    // get current node handle id
    const currentRefId = scrollableRef.current?.id ?? null;

    if (currentRefId !== ref.id) {
      if (scrollableRef.current) {
        // @ts-ignore
        previousScrollableRef.current = scrollableRef.current;
      }
      // @ts-ignore
      scrollableRef.current = ref;
    }
  }, []);

  const removeScrollableRef = useCallback((ref: RefObject<Scrollable | null>) => {
    // find node handle id
    let id: NodeHandle | null;
    try {
      id = findNodeHandle(ref.current);
    } catch {
      return;
    }

    // get current node handle id
    const currentRefId = scrollableRef.current?.id ?? null;

    /**
     * @DEV
     * when the incoming node is actually the current node, we reset
     * the current scrollable ref to the previous one.
     */
    if (id === currentRefId) {
      // @ts-ignore
      scrollableRef.current = previousScrollableRef.current;
    }
  }, []);
  //#endregion

  return {
    state,
    status,
    setScrollableRef,
    removeScrollableRef,
  };
};
