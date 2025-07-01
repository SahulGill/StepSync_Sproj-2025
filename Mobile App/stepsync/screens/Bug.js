import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const ReportBug = ({navigation}) => {
      const buttonScale = useSharedValue(1);
    
      const animatedButtonStyle = useAnimatedStyle(() => {
        return {
          transform: [{ scale: buttonScale.value }],
          backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', // Change color on press
        };
      });
    
      const handlePressIn = () => {
        buttonScale.value = withTiming(0.95, { duration: 100 });
      };
    
      const handlePressOut = () => {
        buttonScale.value = withTiming(1, { duration: 100 });
        navigation.goBack()
      };

      const back = () => {
        navigation.goBack()
      }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={back}><Ionicons name="arrow-back" size={24} color="white" style={styles.backIcon} /></TouchableOpacity>
        
        <Text style={styles.headerText}>Report a bug</Text>
      </View>
      
      {/* Bug Report Input Section */}
      <TextInput
        style={styles.bugInput}
        placeholder="Describe the bug here..."
        placeholderTextColor="#D3B3E5"
        multiline
      />
      
      {/* Report Button */}
      <Animated.View style={[styles.reportButton, animatedButtonStyle]}>
        <TouchableOpacity 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut} 
          onPress={() => console.log("Button Pressed")}
        >
          <Text style={styles.reportButtonText}>LET'S GO</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 70,
    backgroundColor: '#2D1B3D',
    paddingLeft: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    top: 0
  },
  backIcon: {
    marginRight: 10,
    marginTop: 10,
    color: '#00FF00'
  },
  headerText: {
    color: '#FF00FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: '23%',
    marginTop: 10,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bugInput: {
    width: '85%',
    height: 400,
    backgroundColor: '#2D1B3D',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    marginTop: 80,
    textAlignVertical: 'top',
  },
  reportButton: {
    paddingVertical: 15,
    width: '50%',
    borderWidth: 1,
    borderColor: '#00FF00', // Neon green border for inputs
    paddingHorizontal: 15,
    backgroundColor: '#2D1B3D',
    height: 'auto',
    borderRadius: 10,
    marginTop: '10%'
  },
  reportButtonText: {
    color: '#FF00FF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
},
});

export default ReportBug;
