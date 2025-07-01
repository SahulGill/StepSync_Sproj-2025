import React from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { useEffect, useState } from 'react';

const ProgressPage = ({navigation}) => {

  const [username, setUsername] = useState('');
  const [profilePic, setprofilePic] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [sessionsData, setSessionsData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgDifficulty, setAvgDifficulty] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  
  const profilePictures = {
    'default.jpg': require('../assets/defaultProfile.jpg'),
    'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
    'boyWhite.png': require('../assets/gamerBoyWhite.png'),
    'kid.png': require('../assets/gamerKid.png'),
    'girlAsian.png': require('../assets/gamerGirlAsian.png')
  };

  const screenWidth = Dimensions.get('window').width;

  // Helper function to calculate streak from session timestamps
  const calculateStreakFromSessions = (sessions) => {
    if (!sessions || Object.keys(sessions).length === 0) return 0;

    // Get unique dates from sessions (convert timestamps to date strings)
    const sessionDates = Object.values(sessions)
      .map(session => {
        const date = new Date(session.timestamp * 1000);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      })
      .filter(date => date);

    // Get unique dates and sort them (most recent first)
    const uniqueDates = [...new Set(sessionDates)].sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date(today);
    
    // Start checking from today or yesterday
    let startDate = todayStr;
    if (uniqueDates[0] === yesterdayStr && !uniqueDates.includes(todayStr)) {
      // If most recent session was yesterday and no session today, start from yesterday
      startDate = yesterdayStr;
      currentDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }

    // Count consecutive days with sessions
    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = uniqueDates[i];
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (sessionDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break; // Break streak if day is missed
      }
    }
    
    return streak;
  };

  // Helper function to get dynamic status message
  const getStatusMessage = (streak) => {
    if (streak === 0) {
      return "Ready to start your fitness journey!";
    } else if (streak === 1) {
      return "Great start! Keep the momentum going!";
    } else if (streak < 7) {
      return `Day ${streak} streak! You're building a habit!`;
    } else if (streak < 30) {
      return `${streak} day streak! You're on fire! 🔥`;
    } else {
      return `Amazing ${streak} day streak! You're unstoppable! 💪`;
    }
  };

  // Helper function to process sessions for analytics
  const processSessionsForChart = (sessions) => {
    if (!sessions) return null;

    const last7Days = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push({
        dateStr: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en', { weekday: 'short' })
      });
    }

    const easySessions = [];
    const hardSessions = [];

    last7Days.forEach(day => {
      let easyCount = 0;
      let hardCount = 0;

      Object.values(sessions).forEach(session => {
        // Convert timestamp to date string
        const sessionDate = new Date(session.timestamp * 1000);
        const sessionDateStr = sessionDate.toISOString().split('T')[0];

        if (sessionDateStr === day.dateStr) {
          if (session.difficulty === 'easy') {
            easyCount++;
          } else if (session.difficulty === 'hard') {
            hardCount++;
          } else if (session.difficulty === 'medium') {
            // Count medium as 0.5 for both easy and hard
            easyCount += 0.5;
            hardCount += 0.5;
          }
        }
      });

      easySessions.push(easyCount);
      hardSessions.push(hardCount);
    });

    return {
      labels: last7Days.map(day => day.label),
      datasets: [
        {
          data: easySessions,
          color: (opacity = 1) => `rgba(255, 0, 255, ${opacity})`, // Pink line
          strokeWidth: 3
        },
        {
          data: hardSessions,
          color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`, // Green line
          strokeWidth: 3
        }
      ],
      legend: ['Easy Sessions', 'Hard Sessions']
    };
  };

  // Calculate analytics stats
  const calculateStats = (sessions) => {
    if (!sessions) return { total: 0, avgDiff: 0, completion: 0 };

    const sessionArray = Object.values(sessions);
    const total = sessionArray.length;
    
    // Calculate average difficulty (easy=1, medium=2, hard=3)
    const difficultySum = sessionArray.reduce((sum, session) => {
      const diffMap = { easy: 1, medium: 2, hard: 3 };
      return sum + (diffMap[session.difficulty] || 2);
    }, 0);
    const avgDiff = total > 0 ? (difficultySum / total).toFixed(1) : 0;
    
    // // Calculate completion rate (assuming all fetched sessions are completed)
    // const completion = 100; // Since we only store completed sessions
    
    return { total, avgDiff};
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
          
          // Set basic user info
          setUsername(userData.username || 'Unknown User');
          setprofilePic(userData.profilePicUrl || 'default.jpg');
          
          // Process sessions data
          if (userData.sessions) {
            const sessions = userData.sessions;
            setSessionsData(sessions);
            
            // Calculate streak from session timestamps
            const streak = calculateStreakFromSessions(sessions);
            setStreakCount(streak);
            
            // Process chart data using timestamps
            const chart = processSessionsForChart(sessions);
            setChartData(chart);
            
            // Calculate stats
            const stats = calculateStats(sessions);
            setTotalSessions(stats.total);
            setAvgDifficulty(stats.avgDiff);
            // setCompletionRate(stats.completion);
            
          } else {
            // No sessions data
            setStreakCount(0);
            setTotalSessions(0);
            setAvgDifficulty(0);
            // setCompletionRate(0);
          }
        }
      });

      return () => {
        off(userRef);
      };
    }
  }, []);
  
  const homepage = () => {
    navigation.push('home');
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

  // Default chart data if no sessions
  const defaultChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(255, 0, 255, ${opacity})`,
        strokeWidth: 3
      },
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
        strokeWidth: 3
      }
    ],
    legend: ['Easy Sessions', 'Hard Sessions']
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>PROGRESS</Text>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <Image source={profilePictures[profilePic]} style={styles.profileImage} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.userStatus}>{getStatusMessage(streakCount)}</Text>
          </View>
        </View>
      </View>

      {/* Main Content - Scrollable */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Progress Section with Streak and Circular Progress */}
        <View style={styles.progressSection}>
          {/* Streak Counter */}
          <View style={styles.streakContainer}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame" size={100} color="#FF6B35" />
            </View>
            <Text style={styles.streakNumber}>{streakCount}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakMotivation}>
              {streakCount > 0 ? 'Keep it going!' : 'Start your streak!'}
            </Text>
          </View>
        </View>

        {/* Analytics Graph Section */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Session Analytics</Text>
          <Text style={styles.analyticsSubtitle}>Weekly workout intensity breakdown</Text>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData || defaultChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#2D1B3D',
                backgroundGradientFrom: '#2D1B3D',
                backgroundGradientTo: '#2D1B3D',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#444',
                  strokeWidth: 1
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF00FF' }]} />
              <Text style={styles.legendText}>Easy Sessions</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00FF00' }]} />
              <Text style={styles.legendText}>Hard Sessions</Text>
            </View>
          </View>

          {/* Additional Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{avgDifficulty}</Text>
              <Text style={styles.statLabel}>Avg Difficulty</Text>
            </View>
            {/* <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View> */}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
        <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        <View style={styles.homeIconContainer}>
          <TouchableOpacity onPress={homepage}><Ionicons name="home" size={28} color="black" /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={Zonepage}><Ionicons name="game-controller" size={24} color="black" /></TouchableOpacity>
        
        <Ionicons name="flame" size={24} color="#FF00FF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        // backgroundColor: '#000'
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
        zIndex: 1,
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
    mainContent: {
        flex: 1,
        width: '100%',
        marginTop: 180,
        paddingHorizontal: 20,
        marginBottom: 80,
    },
    progressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    streakContainer: {
        alignItems: 'center',
        flex: 1,
        top: 30,
    },
    streakIconContainer: {
        backgroundColor: '#2D1B3D',
        padding: 15,
        borderRadius: 25,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#FF6B35',
    },
    streakNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF6B35',
        textShadowColor: '#FF6B35',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    streakLabel: {
        fontSize: 14,
        color: '#00FF00',
        fontWeight: '600',
    },
    streakMotivation: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    circularProgressContainer: {
        alignItems: 'center',
        flex: 1,
    },
    progressText: {
        fontSize: 16,
        color: '#00FF00',
        fontWeight: 'bold',
    },
    stepCount: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#FF00FF'
    },
    stepGoal: {
        fontSize: 12,
        color: '#00FF00',
        marginTop: 2,
    },
    analyticsSection: {
        marginTop: 30,
        alignItems: 'center',  
    },
    analyticsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF00FF',
        textAlign: 'center',
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    analyticsSubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    chartContainer: {
        backgroundColor: '#2D1B3D',
        borderRadius: 16,
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#FF00FF',
    },
    chart: {
        borderRadius: 16,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        color: '#00FF00',
        fontSize: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
        marginTop: 25,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        backgroundColor: '#2D1B3D',
        padding: 15,
        borderRadius: 12,
        minWidth: 80,
        borderWidth: 1,
        borderColor: '#444',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF00FF',
    },
    statLabel: {
        fontSize: 11,
        color: '#00FF00',
        marginTop: 4,
        textAlign: 'center',
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

export default ProgressPage;