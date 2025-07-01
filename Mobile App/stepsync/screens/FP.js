import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ForgotPassword = ({navigation}) => {
  const buttonScale = useSharedValue(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address', [{ text: 'OK' }]);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'Reset Email Sent!', 
        'Check your email for password reset instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not send reset email. Please check your email address.', [{ text: 'Try Again' }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#00FF00" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Step Sync</Text>
      </View>
      
      <Text style={styles.title}>FORGOT PASSWORD</Text>
      <Text style={styles.subtitle}>Don't worry, we'll help you get back on track!</Text>
      
      <Text style={styles.label}>NAME:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter your full name" 
        placeholderTextColor="#ddd" 
        onChangeText={text => setName(text)}
        value={name}
        autoCapitalize="words"
      />
      
      <Text style={styles.label}>EMAIL:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter your registered email address" 
        placeholderTextColor="#ddd" 
        keyboardType="email-address"
        onChangeText={text => setEmail(text)}
        value={email}
        autoCapitalize="none"
      />
      
      <Animated.View style={[styles.button, animatedButtonStyle]}>
        <TouchableOpacity 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut} 
          onPress={handleResetPassword}
        >
          <Text style={styles.buttonText}>SEND RESET EMAIL</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'transparent', // Dark background for neon effect
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
    },
    headerBar: {
        width: '120%',
        height: 100,
        backgroundColor: '#2D1B3D',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        position: 'absolute',
        top: -1,
        borderWidth: 1,
        borderColor: '#00FF00', // Neon green border
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        flexDirection: 'row',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: '50%',
        transform: [{ translateY: -12 }],
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        zIndex: 1,
    },
    headerText: {
        color: '#00FF00', // Neon green text
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: '#00FF00',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        paddingTop: '10%'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FF00FF', // Neon pink color for title
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginTop: '20%'
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
        marginBottom: 50,
        fontStyle: 'italic',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 10,
        color: '#00FF00', // Neon green for labels
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        backgroundColor: '#2D1B3D',
        paddingHorizontal: 15,
        color: 'white',
        marginBottom: 30,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#00FF00', // Neon green border for inputs
    },
    button: {
        paddingVertical: 15,
        width: '60%',
        borderWidth: 1,
        borderColor: '#00FF00', // Neon green border for inputs
        paddingHorizontal: 15,
        backgroundColor: '#2D1B3D',
        height: 'auto',
        borderRadius: 10,
        marginTop: '30%'
    },
    buttonText: {
        color: '#FF00FF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        },
});

export default ForgotPassword;