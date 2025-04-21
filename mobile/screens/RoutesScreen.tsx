import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

export default function RoutesScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my');

  const myRoutes = [
    {
      id: '1',
      from: 'BP - Pleasant Hill',
      to: "Mazzy's",
      distance: '2.3Mi',
    },
    // Add more routes if needed
  ];

  const renderRouteCard = (route: (typeof myRoutes)[0]) => (
    <TouchableOpacity style={styles.routeCard}>
      <Text style={styles.routeText}>{route.from}</Text>
      <Text style={styles.routeText}>{route.to}</Text>
      <Text style={styles.distance}>{route.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('my')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'my' && styles.activeTabText,
            ]}>
            My Routes
          </Text>
          {activeTab === 'my' && <View style={styles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('find')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'find' && styles.activeTabText,
            ]}>
            Find Routes
          </Text>
          {activeTab === 'find' && <View style={styles.underline} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'my' ? (
          <View>
            <View style={styles.plusBtnRow}>
              <TouchableOpacity style={styles.plusBtn}>
                <Text style={styles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={myRoutes}
              keyExtractor={item => item.id}
              renderItem={({item}) => renderRouteCard(item)}
            />
          </View>
        ) : (
          <Text style={styles.placeholder}>
            Search for community routes here
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tab: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#f3631a',
  },
  underline: {
    marginTop: 4,
    height: 2,
    width: 60,
    backgroundColor: '#f3631a',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  routeCard: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  distance: {
    color: '#aaa',
    fontSize: 14,
  },
  placeholder: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  plusBtnRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 20,
    paddingRight: 20,
  },

  plusBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0, // remove shadow
  },
  plusIcon: {
    fontSize: 28,
    color: '#f3631a',
    fontWeight: 'bold',
    lineHeight: 28,
  },
});
