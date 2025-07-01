import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const Home = ({navigation}) => {
  // Animation values for heartbeat
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [lastSessionScore, setLastSessionScore] = useState(0);
  const [todaySessionCount, setTodaySessionCount] = useState(0);

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

  // Helper function to get latest session score
  const getLatestSessionScore = (sessions) => {
    if (!sessions) return 0;
    
    const sessionArray = Object.values(sessions);
    if (sessionArray.length === 0) return 0;
    
    const latestSession = sessionArray.sort((a, b) => b.timestamp - a.timestamp)[0];
    return latestSession.score || 0;
  };

  // Dynamic greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Dynamic motivation message based on user data
  const getMotivationMessage = () => {
    if (todaySessionCount === 0) {
      if (streakCount === 0) {
        return "Ready to start your fitness journey? Let's begin!";
      } else {
        return `You have a ${streakCount}-day streak! Don't break it today!`;
      }
    } else if (todaySessionCount === 1) {
      return `Great! You've completed ${todaySessionCount} session today. Want to go for another?`;
    } else {
      return `Amazing! ${todaySessionCount} sessions completed today. You're on fire! 🔥`;
    }
  };

  // Dynamic fitness quote based on streak and performance
  const getFitnessQuote = () => {
    if (streakCount === 0) {
      return "\"Every journey begins with a single step\"";
    } else if (streakCount < 7) {
      return "\"Consistency builds champions\"";
    } else if (streakCount < 30) {
      return "\"Your dedication is inspiring\"";
    } else {
      return "\"You're a fitness legend in the making\"";
    }
  };

  // Dynamic daily motivation based on user progress
  const getDailyMotivation = () => {
    const motivations = {
      title: "",
      subtitle: ""
    };

    if (totalSessions === 0) {
      motivations.title = "Ready to make today amazing?";
      motivations.subtitle = "Your fitness adventure starts here...";
    } else if (todaySessionCount === 0) {
      motivations.title = "Today is full of possibilities!";
      motivations.subtitle = "Your body is ready for action...";
    } else if (lastSessionScore > 0) {
      motivations.title = "You're crushing your goals!";
      motivations.subtitle = `Latest score: ${lastSessionScore} points!`;
    } else {
      motivations.title = "Keep the momentum going!";
      motivations.subtitle = "Every session makes you stronger...";
    }

    return motivations;
  };

  const progresspage = () => {
    navigation.push('progress');
  }

  const leaderpage = () => {
    navigation.push('leaderboard');
  }

  const Zonepage = () => {
    navigation.push('gamezone');
  }

  const settings = () => {
    navigation.push('setting');
  }

  const startHeartbeat = () => {
    const heartbeatSequence = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
    ]);
    Animated.loop(heartbeatSequence).start();
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
          setProfilePic(userData.profilePicUrl || 'default.jpg');
          
          if (userData.sessions) {
            const sessions = userData.sessions;
            
            // Calculate all dynamic values
            const streak = calculateStreakFromSessions(sessions);
            const todaySessions = getTodaySessionCount(sessions);
            const latestScore = getLatestSessionScore(sessions);
            const total = Object.keys(sessions).length;
            
            setStreakCount(streak);
            setTodaySessionCount(todaySessions);
            setLastSessionScore(latestScore);
            setTotalSessions(total);
          } else {
            // No sessions data
            setStreakCount(0);
            setTodaySessionCount(0);
            setLastSessionScore(0);
            setTotalSessions(0);
          }
        }
      });

      return () => {
        off(userRef);
      };
    }

    startHeartbeat();
  }, []);

  const dailyMotivation = getDailyMotivation();

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Step Sync</Text>
        <Text style={styles.subtitle}>Join the fitness revolution!</Text>
      </View>

      {/* Welcome & Motivation */}
      <Text style={styles.greeting}>{getTimeBasedGreeting()}, {username}!</Text>
      <Text style={styles.motivation}>{getMotivationMessage()}</Text>

      {/* Main Visual Element - Animated Pulse */}
      <View style={styles.mainVisual}>
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseOuter]}>
            <View style={[styles.pulseMiddle]}>
              <Animated.View style={[styles.pulseInner, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name="fitness" size={40} color="#FF00FF" />
              </Animated.View>
            </View>
          </View>
        </View>
        <Text style={styles.fitnessQuote}>{getFitnessQuote()}</Text>
      </View>

      {/* Daily Motivation */}
      <View style={styles.dailyMotivation}>
        <Text style={styles.motivationEmoji}>
          {todaySessionCount > 0 ? '🔥' : streakCount > 0 ? '⭐' : '🌟'}
        </Text>
        <Text style={styles.motivationQuote}>{dailyMotivation.title}</Text>
        <Text style={styles.motivationSubtext}>{dailyMotivation.subtitle}</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
        <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        
        <View style={styles.homeIconContainer}>
          <Ionicons name="home" size={28} color="#FF00FF" />
        </View>
        <TouchableOpacity onPress={Zonepage}><Ionicons name="game-controller" size={24} color="black" /></TouchableOpacity>
        
        <TouchableOpacity onPress={progresspage}>
          <Ionicons name="flame" size={24} color="black" />
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

// const Home = ({navigation}) => {
//   // Example step count and goal for display
//   const steps = 3700;
//   const goal = 5000;

//   // Animation values for heartbeat
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const pulseAnim1 = useRef(new Animated.Value(1)).current;
//   const pulseAnim2 = useRef(new Animated.Value(1)).current;

//   const progresspage = () => {
//     navigation.push('progress');
//   }

//   const leaderpage = () => {
//     navigation.push('leaderboard');
//   }

//   const Zonepage = () => {
//     navigation.push('gamezone');
//   }

//   const settings = () => {
//     navigation.push('setting');
//   }

//   const [username, setUsername] = useState('');
//   const [profilePic, setProfilePic] = useState('');

//   const startHeartbeat = () => {
//     const heartbeatSequence = Animated.sequence([
//       // First beat
//       Animated.timing(scaleAnim, {
//         toValue: 1.1,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       // Short pause
//       Animated.delay(100),
//       // Second beat
//       Animated.timing(scaleAnim, {
//         toValue: 1.15,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       // Longer pause before next cycle
//       Animated.delay(1000),
//     ]);
//     Animated.loop(heartbeatSequence).start();
//   };

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const auth = getAuth();
//       const user = auth.currentUser;

//       if (user) {
//         const uid = user.uid;
//         const db = getDatabase();
//         const snapshot = await get(ref(db, `users/${uid}`));

//         if (snapshot.exists()) {
//           const data = snapshot.val();
//           setUsername(data.username);
//           setProfilePic(data.profilePicUrl)
//         }
//       }
//     };

//     fetchUserData();
//     startHeartbeat();
//     }, []);

//   return (
//     <View style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.headerBar}>
//         <Text style={styles.headerText}>Step Sync</Text>
//         <Text style={styles.subtitle}>Join the fitness revolution!</Text>
//       </View>

//       {/* Welcome & Motivation */}
//       <Text style={styles.greeting}>Hey, {username}!</Text>
//       <Text style={styles.motivation}>You're just {goal - steps} points away from your goal today! Keep going!</Text>

//       {/* Main Visual Element - Animated Pulse */}
//       <View style={styles.mainVisual}>
//         <View style={styles.pulseContainer}>
//           <View style={[styles.pulseOuter, ]}>
//             <View style={[styles.pulseMiddle, ]}>
//               <Animated.View style={[styles.pulseInner, { transform: [{ scale: scaleAnim }] }]}>
//                 <Ionicons name="fitness" size={40} color="#FF00FF" />
//               </Animated.View>
//             </View>
//           </View>
//         </View>
//         <Text style={styles.fitnessQuote}>"Your heart beats for your dreams"</Text>
//       </View>

//       {/* Daily Motivation */}
//       <View style={styles.dailyMotivation}>
//         <Text style={styles.motivationEmoji}>🌟</Text>
//         <Text style={styles.motivationQuote}>Ready to make today amazing?</Text>
//         <Text style={styles.motivationSubtext}>Your fitness journey continues...</Text>
//       </View>

//       {/* Bottom Navigation Bar */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        
//         <View style={styles.homeIconContainer}>
//           <Ionicons name="home" size={28} color="#FF00FF" />
//         </View>
//         <TouchableOpacity onPress={Zonepage}><Ionicons name="game-controller" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={progresspage}>
//           <Ionicons name="flame" size={24} color="black" />
//         </TouchableOpacity>
        
//       </View>
//     </View>
//   );
// };

const styles = StyleSheet.create({
container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    // backgroundColor: '#000',
    // paddingHorizontal: 20,
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
        marginTop: '14%',
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        marginTop: 5,
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
        marginBottom: 50,
      },
    greeting: {
        fontSize: 24,
        color: '#00FF00',
        textAlign: 'center',
        marginTop: 220,
        fontWeight: 'bold',
      },
      motivation: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
      },
      mainVisual: {
        alignItems: 'center',
        marginTop: 20,
        // marginBottom: 40,
      },
      pulseContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      },
      pulseOuter: {
        width: 160,
        height: 160,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 0, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 0, 255, 0.3)',
      },
      pulseMiddle: {
        width: 110,
        height: 110,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 0, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 0, 255, 0.5)',
      },
      pulseInner: {
        width: 60,
        height: 60,
        borderRadius: 50,
        backgroundColor: '#2D1B3D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FF00FF',
        shadowColor: '#FF00FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      fitnessQuote: {
        fontSize: 16,
        color: '#00FF00',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 40,
        // marginTop: 10,
        marginBottom: 10
      },
      insightsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 40,
      },
      insightCard: {
        backgroundColor: '#2D1B3D',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        minWidth: 90,
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 255, 0.3)',
        shadowColor: '#FF00FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      insightIcon: {
        marginBottom: 8,
      },
      insightLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 4,
      },
      insightValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF00FF',
      },
      dailyMotivation: {
        alignItems: 'center',
        backgroundColor: 'rgba(45, 27, 61, 0.5)',
        padding: 30,
        borderRadius: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 0, 0.3)',
      },
      motivationEmoji: {
        fontSize: 40,
        marginBottom: 15,
      },
      motivationQuote: {
        fontSize: 20,
        color: '#00FF00',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 8,
      },
      motivationSubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic',
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

export default Home;

// import React, { useState } from 'react';
// import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as Progress from 'react-native-progress';
// import { getAuth } from 'firebase/auth';
// import { getDatabase } from 'firebase/database';
// import { get, ref } from 'firebase/database';
// import { useEffect } from 'react';

// const Home = ({navigation}) => {
//   // Example step count and goal
//   const steps = 3700;
//   const goal = 5000;
//   const progress = steps / goal; // Calculate progress as a percentage

//   const progresspage = () => {
//     navigation.push('progress');
//   }

//   const leaderpage = () => {
//     navigation.push('leaderboard');
//   }

//   const Zonepage = () => {
//     navigation.push('gamezone');
//   }

//   const settings = () => {
//     navigation.push('setting');
//   }

//   const [username, setUsername] = useState('');

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const auth = getAuth();
//       const user = auth.currentUser;

//       if (user) {
//         const uid = user.uid;
//         const db = getDatabase();
//         const snapshot = await get(ref(db, `users/${uid}`));

//         if (snapshot.exists()) {
//           const data = snapshot.val();
//           setUsername(data.username);
//         }
//       }
//     };

//     fetchUserData();
//     }, []);


//   return (
//     <View style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.headerBar}>
//         <Text style={styles.headerText}>Step Sync</Text>
//         <Text style={styles.subtitle}>Join the fitness revolution!</Text>
//       </View>

//       {/* Welcome & Motivation */}
//       <Text style={styles.greeting}>Hey, {username}!</Text>
//       <Text style={styles.motivation}>You're just {goal - steps} steps away from your goal today! Keep going!</Text>

//       {/* Circular Progress Bar and Step Tracker */}
//       <View style={styles.stepTracker}>
//         <Progress.Circle
//           progress={progress}
//           size={150}
//           showsText={true}
//           textStyle={styles.progressText}
//           borderWidth={10}
//           color="#FF00FF"
//           unfilledColor="#0000"
//           thickness={8}
//         />
//         <Text style={styles.stepCount}>{steps} / {goal} steps</Text>
//         <Text style={styles.stepGoal}>Goal: {goal} steps</Text>
//       </View>

//       {/* Bottom Navigation Bar */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        
//         <View style={styles.homeIconContainer}>
//           <Ionicons name="home" size={28} color="#FF00FF" />
//         </View>
//         <TouchableOpacity onPress={Zonepage}><Ionicons name="game-controller" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={progresspage}>
//           <Ionicons name="flame" size={24} color="black" />
//         </TouchableOpacity>
        
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
// container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%'
//     },
//     headerBar: {
//     width: '120%',
//     height: 200,
//     backgroundColor: '#2D1B3D',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomLeftRadius: 200,
//     borderBottomRightRadius: 200,
//     position: 'absolute',
//     top: 0,
//     },
//     headerText: {
//         color: '#FF00FF',
//         fontSize: 28,
//         fontWeight: 'bold',
//         marginTop: '14%',
//         textShadowColor: '#FF00FF',
//         textShadowOffset: { width: 0, height: 0 },
//         textShadowRadius: 10,
//     },
//     subtitle: {
//         marginTop: 5,
//         fontSize: 16,
//         color: 'gray',
//         textAlign: 'center',
//         marginBottom: 50,
//       },
//     greeting: {
//         fontSize: 20,
//         color: '#00FF00',
//         textAlign: 'center',
//         marginTop: 80,
//       },
//       motivation: {
//         fontSize: 16,
//         color: '#888',
//         textAlign: 'center',
//         marginTop: 10,
//       },
//       stepTracker: {
//         marginTop: 50,
//         alignItems: 'center',
//       },
//       progressText: {
//         fontSize: 18,
//         color: '#00FF00',
//         fontWeight: 'bold',
//       },
//       stepCount: {
//         fontSize: 30,
//         fontWeight: 'bold',
//         marginTop: 50,
//         color: '#FF00FF'
//       },
//       stepGoal: {
//         fontSize: 18,
//         color: '#00FF00',
//         marginTop: 5,
//       },
//   userSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: -20,
//     padding: 10,
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginTop: 10
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#D3B3E5',
//   },
//   userInfo: {
//     marginLeft: 10,
//   },
//   username: {
//     fontSize: 16,
//     // fontWeight: 'bold',
//     color: '#FF00FF'
//   },
//   userStatus: {
//     fontSize: 12,
//     color: 'gray',
//   },
//   mainTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: '#00FF00', // Neon pink color for title
//     textShadowColor: '#00FF00',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//     marginTop: '20%'
//   },
//   weightSection: {
//     marginTop: 80,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FF00FF'
//   },
//   input: {
//     width: '40%',
//     height: 40,
//     borderRadius: 10,
//     textAlign: 'center',
//     color: '#00FF00',
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#00FF00', // Neon green border for inputs
//     backgroundColor: '#2D1B3D',
//   },
//   bottomNav: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: 70,
//     backgroundColor: '#2D1B3D',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   homeIconContainer: {
//     backgroundColor: '#2D1B3D',
//     padding: 10,
//     borderRadius: 30,
//     marginBottom: 10,
//   },
// });

// export default Home;