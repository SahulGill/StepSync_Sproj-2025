import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Register = ({navigation}) => {
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
    // navigation.goBack();
  };

  const handleGoBack = () => {
  navigation.goBack();
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState({Email: ''});
  
  // States for password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleRegister = async () => {
    
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill all fields', [{ text: 'Try Again' }]);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match', [{ text: 'Try Again' }]);
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    try {
      user.Email = email;
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userID = userCred.user.uid;

      navigation.push('userdetails', {user, userID, email: user.Email});
    } 
    
    catch (error) {
      Alert.alert('Error', 'Could not Register Account', [{ text: 'Try Again' }]);
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
      
      <Text style={styles.title}>REGISTER</Text>
      <Text style={styles.subtitle}>tag line related to fitness!</Text>
      
      <Text style={styles.label}>EMAIL:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter your email" 
        placeholderTextColor="#ddd" 
        keyboardType="email-address" 
        onChangeText={text => setEmail(text)} 
        value={email}
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>PASSWORD:</Text>
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Enter your password" 
          placeholderTextColor="#ddd" 
          secureTextEntry={!passwordVisible}
          onChangeText={text => setPassword(text)} 
          value={password}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.eyeButton} 
          onPress={togglePasswordVisibility}
        >
          <Ionicons 
            name={passwordVisible ? "eye" : "eye-off"} 
            size={24} 
            color="#00FF00" 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.label}>CONFIRM PASSWORD:</Text>
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Confirm password" 
          placeholderTextColor="#ddd" 
          secureTextEntry={!confirmPasswordVisible}
          onChangeText={text => setConfirmPassword(text)} 
          value={confirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.eyeButton} 
          onPress={toggleConfirmPasswordVisibility}
        >
          <Ionicons 
            name={confirmPasswordVisible ? "eye" : "eye-off"} 
            size={24} 
            color="#00FF00" 
          />
        </TouchableOpacity>
      </View>
      
      <Animated.View style={[styles.button, animatedButtonStyle]}>
        <TouchableOpacity 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut} 
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>LET'S GO</Text>
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
      passwordContainer: {
        width: '100%',
        position: 'relative',
        marginBottom: 30,
      },
      passwordInput: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        backgroundColor: '#2D1B3D',
        paddingHorizontal: 15,
        paddingRight: 50, // Make space for the eye icon
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#00FF00',
      },
      eyeButton: {
        position: 'absolute',
        right: 15,
        top: 13,
        padding: 5,
      },
      button: {
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
      buttonText: {
          color: '#FF00FF',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          textShadowColor: '#FF00FF',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
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
});

export default Register;