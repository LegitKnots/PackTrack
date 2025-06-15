'use client';

import {useState, useCallback, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {X, Flashlight} from 'lucide-react-native';
import {PRIMARY_APP_COLOR} from '../config';
import {useFocusEffect} from '@react-navigation/native';

interface QRCodeScannerProps {
  onClose: () => void;
  onCodeScanned: (value: string) => void;
}

const {width} = Dimensions.get('window');

export default function QRCodeScanner({
  onClose,
  onCodeScanned,
}: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torch, setTorch] = useState<'off' | 'on'>('off');
  const [isActive, setIsActive] = useState(true);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  // Request camera permission
  useEffect(() => {
    (async () => {
      const currentStatus = (await Camera.getCameraPermissionStatus()) as
        | 'authorized'
        | 'denied'
        | 'not-determined';

      if (currentStatus === 'authorized') {
        setHasPermission(true);
      } else if (currentStatus === 'denied') {
        setHasPermission(false);
      } else {
        const newStatus = (await Camera.requestCameraPermission()) as
          | 'authorized'
          | 'denied';
        setHasPermission(newStatus === 'authorized');
      }
    })();
  }, []);

  // QR code scanner handler
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && isActive) {
        const qrData = codes[0].value;
        if (qrData) {
          setIsActive(false);
          onCodeScanned(qrData);
        }
      }
    },
  });

  // Manage camera activity when screen is focused
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, []),
  );

  const toggleTorch = () => {
    setTorch(torch === 'on' ? 'off' : 'on');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PRIMARY_APP_COLOR} />
        <Text style={styles.text}>Checking camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Camera permission is required to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device available</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
        torch={torch}
        enableZoomGesture
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Scan QR Code</Text>
        <TouchableOpacity onPress={toggleTorch} style={styles.flashButton}>
          <Flashlight
            color={torch === 'on' ? PRIMARY_APP_COLOR : 'white'}
            size={24}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Position the QR code within the frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: PRIMARY_APP_COLOR,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  flashButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginVertical: 20,
  },
  button: {
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
