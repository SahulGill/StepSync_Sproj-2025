import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { CommonActions } from '@react-navigation/native';

const Settings = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [profilePic, setprofilePic] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [todaySessionCount, setTodaySessionCount] = useState(0);

  const profilePictures = {
    'default.jpg': require('../assets/defaultProfile.jpg'),
    'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
    'boyWhite.png': require('../assets/gamerBoyWhite.png'),
    'kid.png': require('../assets/gamerKid.png'),
    'girlAsian.png': require('../assets/gamerGirlAsian.png')
  };

  // Helper function to calculate streak from session timestamps
  const calculateStreakFromSessions = (sessions) => {
    if (!sessions || Object.keys(sessions).length === 0) return 0;

    const sessionDates = Object.values(sessions)
      .map(session => {
        const date = new Date(session.timestamp * 1000);
        return date.toISOString().split('T')[0];
      })
      .filter(date => date);

    const uniqueDates = [...new Set(sessionDates)].sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date(today);
    
    let startDate = todayStr;
    if (uniqueDates[0] === yesterdayStr && !uniqueDates.includes(todayStr)) {
      startDate = yesterdayStr;
      currentDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = uniqueDates[i];
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (sessionDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Helper function to get today's session count
  const getTodaySessionCount = (sessions) => {
    if (!sessions) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    
    return Object.values(sessions).filter(session => {
      const sessionDate = new Date(session.timestamp * 1000).toISOString().split('T')[0];
      return sessionDate === today;
    }).length;
  };

  // Dynamic status message for settings
  const getSettingsStatusMessage = () => {
    if (totalSessions === 0) {
      return "Welcome to StepSync! Ready to start?";
    } else if (todaySessionCount === 0) {
      if (streakCount === 0) {
        return "Take a break or start a new streak!";
      } else {
        return `${streakCount}-day streak! Don't break it today!`;
      }
    } else if (streakCount >= 30) {
      return `Fitness legend! ${streakCount} days strong! 💪`;
    } else if (streakCount >= 7) {
      return `On fire! ${streakCount}-day streak continues! 🔥`;
    } else {
      return `Day ${streakCount} - Building that habit! ⭐`;
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          
          setUsername(userData.username || 'User');
          setprofilePic(userData.profilePicUrl || 'default.jpg');
          
          if (userData.sessions) {
            const sessions = userData.sessions;
            
            // Calculate dynamic values
            const streak = calculateStreakFromSessions(sessions);
            const todaySessions = getTodaySessionCount(sessions);
            const total = Object.keys(sessions).length;
            
            setStreakCount(streak);
            setTodaySessionCount(todaySessions);
            setTotalSessions(total);
          } else {
            // No sessions data
            setStreakCount(0);
            setTodaySessionCount(0);
            setTotalSessions(0);
          }
        }
      });

      return () => {
        off(userRef);
      };
    }
  }, []);

  const progresspage = () => {
    navigation.push('progress');
  }

  const leaderpage = () => {
    navigation.push('leaderboard');
  }

  const Zonepage = () => {
    navigation.push('gamezone');
  }

  const homepage = () => {
    navigation.push('home');
  }

  const profile = () => {
    navigation.push('editprofile');
  }

  const help = () => {
    navigation.push('help');
  }

  const bug = () => {
    navigation.push('bugreport');
  }

  // Proper logout function
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const auth = getAuth();
              
              // Sign out from Firebase
              await signOut(auth);
              
              // Clear any local state/data if needed
              setUsername('');
              setprofilePic('');
              
              // Reset navigation stack and navigate to login
              // This prevents users from going back to authenticated screens
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'login' }], // Replace 'login' with your actual login screen name
                })
              );
              
              console.log('User logged out successfully');
              
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>SETTINGS</Text>
        <View style={styles.userSection}>
          <Image source={profilePictures[profilePic]} style={styles.profileImage} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.userStatus}>{getSettingsStatusMessage()}</Text>
          </View>
        </View>
      </View>
            
      {/* Settings Options */}
      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.option} onPress={profile}>
          <Text style={styles.optionText}>Edit Profile</Text>
          <Ionicons name="person-outline" size={20} color="#00FF00" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={help}>
          <Text style={styles.optionText}>Help & Support</Text>
          <Ionicons name="help-circle-outline" size={20} color="#00FF00" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={bug}>
          <Text style={styles.optionText}>Report a Bug</Text>
          <Ionicons name="bug-outline" size={20} color="#00FF00" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Text style={[styles.optionText, styles.logoutText]}>Log Out</Text>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
            
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Ionicons name="settings" size={24} color="#FF00FF" />
        
        <TouchableOpacity onPress={leaderpage}>
          <Ionicons name="bar-chart" size={24} color="black" />
        </TouchableOpacity>
                
        <View style={styles.homeIconContainer}>
          <TouchableOpacity onPress={homepage}>
            <Ionicons name="home" size={28} color="black" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={Zonepage}>
          <Ionicons name="game-controller" size={24} color="black" />
        </TouchableOpacity>
          
        <TouchableOpacity onPress={progresspage}>
          <Ionicons name="flame" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  headerBar: {
    width: '120%',
    height: 200,
    backgroundColor: '#2D1B3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    position: 'absolute',
    top: 0,
  },
  headerText: {
    color: '#FF00FF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: '5%',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D3B3E5',
  },
  userInfo: {
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    color: '#00FF00'
  },
  userStatus: {
    fontSize: 12,
    color: 'gray',
  },
  settingsList: {
    marginTop: '35%',
    width: '90%',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 15,
  },
  optionText: {
    fontSize: 20,
    color: '#FF00FF',
    flex: 1,
  },
  logoutText: {
    color: '#FF4444',
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    backgroundColor: '#2D1B3D',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  homeIconContainer: {
    backgroundColor: '#2D1B3D',
    padding: 10,
    borderRadius: 30,
    marginBottom: 10,
  },
});

export default Settings;