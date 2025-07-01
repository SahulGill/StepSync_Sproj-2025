// import { StatusBar } from 'expo-status-bar';
// import { ImageBackground, StyleSheet, Text, View } from 'react-native';
// import bg from './assets/3.png';
// import Navigator from './routes/homestack';
// import { auth } from './firebase';
// import { onAuthStateChanged } from 'firebase/auth';
// import { useState, useEffect } from 'react';

// export default function App() {

//   return (
//     <ImageBackground source={bg} style={styles.background}>
//       <View style={styles.overlay}>
//         <Navigator/>
//         <StatusBar style="auto" />
//         </View>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   // container: {
//   //   flex: 1,
//   //   alignItems: 'center',
//   //   justifyContent: 'center',
//   // },
//   background: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     resizeMode: 'cover',
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject, // Fills the entire background
//     backgroundColor: 'rgba(0, 0, 0, 0.7)', // Black with 50% opacity
//   },
// });

import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, View, ActivityIndicator } from 'react-native';
import bg from './assets/3.png';
import Navigator from './routes/homestack';
// import { auth } from './firebase';
// import { onAuthStateChanged } from 'firebase/auth';
// import { useState, useEffect } from 'react';

export default function App() {

  return (
    // <ImageBackground source={bg} style={styles.background}>
    //   <View style={styles.overlay}>
    //     <Navigator />
    //     <StatusBar style="auto" />
    //   </View>
    // </ImageBackground>

    <ImageBackground source={bg} style={styles.background}>
      <View style={styles.overlay}>
        <Navigator />
        <StatusBar style="auto" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});