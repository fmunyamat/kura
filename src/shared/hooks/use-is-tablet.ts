import DeviceInfo from 'react-native-device-info';

// TabletProps — the prop shape every tablet-aware styled-component receives.
// Shared here so screens don't each declare their own copy of the same interface.
export interface TabletProps {
  $isTablet: boolean;
}

// useIsTablet — tells a component whether the app is running on a tablet.
// It asks the device itself (via react-native-device-info) what kind of
// hardware it is, instead of guessing from the window size. getDeviceType()
// is synchronous and the answer can never change while the app is running,
// so there is no state or effect here — just a direct check on every render,
// which is a cheap string comparison.
export const useIsTablet = (): boolean => {
  return DeviceInfo.getDeviceType() === 'Tablet';
};
