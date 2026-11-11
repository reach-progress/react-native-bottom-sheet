import { Platform } from 'react-native';

/** Native tracks worklet closures; explicit dependencies are only used on web. */
export const webOnlyDependencies = <T extends readonly unknown[] | undefined>(
  dependencies: T
): T | undefined => Platform.OS === 'web' ? dependencies : undefined;
