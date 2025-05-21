declare module 'react-native-screen-brightness' {
    const ScreenBrightness: {
      getBrightness: () => Promise<number>;
      setBrightness: (value: number) => Promise<void>;
      getSystemBrightness?: () => Promise<number>; // some forks include this
      setSystemBrightness?: (value: number) => Promise<void>;
    };
  
    export default ScreenBrightness;
  }
  