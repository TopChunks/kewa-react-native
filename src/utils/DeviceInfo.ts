import { Platform, Dimensions } from 'react-native';
import { DeviceInfo as DeviceInfoType } from '../types'
import DeviceInfo from 'react-native-device-info';

export class DeviceInfoCollector {
  static async collect(): Promise<DeviceInfoType> {
    const { width, height } = Dimensions.get('window');

    const deviceInfo: DeviceInfoType = {
      appName: DeviceInfo.getApplicationName(),
      platform: Platform.OS,
      platformVersion: Platform.Version,
      userAgent: await DeviceInfo.getUserAgent(),
      appVersion: DeviceInfo.getReadableVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      deviceName: await DeviceInfo.getDeviceName(),
      deviceModel: DeviceInfo.getModel(),
      screenWidth: width,
      screenHeight: height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      carrier: await DeviceInfo.getCarrier(),
      brand: DeviceInfo.getBrand(),
      manufacturer: await DeviceInfo.getManufacturer(),
      isTablet: DeviceInfo.isTablet(),
    };

    return deviceInfo;
  }
}