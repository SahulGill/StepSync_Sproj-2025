import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQs = ({ navigation }) => {

  const back = () => {
    navigation.goBack();
  }
  
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <TouchableOpacity onPress={back}><Ionicons name="arrow-back" size={24} color="white" style={styles.backIcon} /></TouchableOpacity>
        </TouchableOpacity>
        <Text style={styles.headerText}>FAQ's</Text>
      </View>
      
      {/* FAQ List */}
      <ScrollView style={styles.faqContainer}>
        <View style={styles.faqItem}>
          <Text style={styles.question}>Q1. How do I reset my password?</Text>
          <Text style={styles.answer}>To reset your password, log out of your account and click 'Forgot Password?'</Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Q1. What should I do if the app crashes?</Text>
          <Text style={styles.answer}>In case if the application crashes due to any reason, clear cache and try launching it again. If the issue still persists report us immediately.</Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>Q3. Does the app track my personal information?</Text>
          <Text style={styles.answer}>The application does keep of the information that the user provides to create a productive environment and experience. The data, however, is kept private for personalized experiences only.</Text>
        </View>
      </ScrollView>
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
  faqContainer: {
    padding: 20,
    marginTop: '40%'
  },
  faqItem: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF00FF',
  },
  answer: {
    fontSize: 14,
    color: '#00FF00',
    marginTop: 5,
  },
});

export default FAQs;