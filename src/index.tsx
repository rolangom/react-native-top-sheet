import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ViewStyle = View['props']['style'];

type ModalProps = {
  children: React.ReactNode;
  /**
   * Percentage of screen height if < 1 otherwise height in pixels
   */
  snap: number;
  shouldHideOnOverlayPress?: boolean;
  overlayStyle?: ViewStyle;
  modalStyle?: ViewStyle;
  handlerStyle?: ViewStyle;
  handlerWrapperStyle?: ViewStyle;
};

export interface ModalHandle {
  show: () => void;
  hide: () => void;
}

const screenHeight = Dimensions.get('window').height;

const TopSheetModal = forwardRef<ModalHandle, ModalProps>(
  (
    {
      children,
      snap,
      shouldHideOnOverlayPress,
      overlayStyle,
      modalStyle,
      handlerWrapperStyle,
      handlerStyle,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const animatedTop = useRef(new Animated.Value(-screenHeight)).current; // Start above the screen

    const modalHeight = useMemo(
      () => (snap > 1 ? snap : screenHeight * snap),
      [snap]
    );

    const show = () => {
      setIsVisible(true);
      Animated.spring(animatedTop, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    };

    const hide = () => {
      Animated.spring(animatedTop, {
        toValue: -modalHeight,
        useNativeDriver: false,
      }).start(() => setIsVisible(false));
    };

    useImperativeHandle(ref, () => ({ show, hide }));

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0 && isVisible) {
          // Dragging upwards
          animatedTop.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (-gestureState.dy > modalHeight / 2) {
          // If dragged up halfway
          hide();
        } else {
          show();
        }
      },
    });

    function onOverlayPress() {
      if (shouldHideOnOverlayPress) hide();
    }

    if (!isVisible) return null;

    return (
      <Pressable
        style={[styles.overlay, overlayStyle]}
        onPress={onOverlayPress}
      >
        <Animated.View
          style={[
            styles.modal,
            modalStyle,
            { top: animatedTop, height: modalHeight },
          ]}
        >
          <SafeAreaView style={styles.container}>
            {children}
            <View
              {...panResponder.panHandlers}
              style={[styles.handlerWrapper, handlerWrapperStyle]}
            >
              <View style={[styles.handler, handlerStyle]} />
            </View>
          </SafeAreaView>
        </Animated.View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start', // Ensure the modal is at the top
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modal: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'white',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    display: 'flex',
  },
  handlerWrapper: {
    width: '100%',
    padding: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  handler: {
    height: 3,
    width: 35,
    backgroundColor: 'black',
    alignSelf: 'center',
  },
});

export default TopSheetModal;
