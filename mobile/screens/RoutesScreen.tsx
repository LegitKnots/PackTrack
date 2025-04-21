import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, FlatList, Alert} from 'react-native';
import {styles} from '../styles/RoutesScreen.styles';

import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateRouteModal from '../components/CreateRouteModal';
import {SERVER_URI} from '../config';
import {jwtDecode} from 'jwt-decode';
import {ScrollView} from 'react-native-gesture-handler';

export default function RoutesScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my');
  const [modalVisible, setModalVisible] = useState(false);
  const [myRoutes, setMyRoutes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert('Authentication Error', 'Missing token');
          return;
        }

        const decoded: any = jwtDecode(token);
        const userId = decoded?.userID;

        if (!userId) {
          throw new Error(
            'Invalid token payload. Missing user ID.\r\nUser ID: ',
          );
        }

        const res = await fetch(`${SERVER_URI}/api/routes/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(text);
        }

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch routes');
        }

        setMyRoutes(data);
      } catch (err: any) {
        Alert.alert('Error Fetching Routes', err.message);
      }
    };

    fetchRoutes();
  }, []);

  const handleCreateRoute = (newRoute: any) => {
    setMyRoutes(prev => [...prev, newRoute]);
    setModalVisible(false);
  };

  const renderRouteCard = (route: any) => (
    <TouchableOpacity style={styles.routeCard}>
      <Text style={styles.routeName} numberOfLines={1} ellipsizeMode="tail">
        {route.name || 'Unnamed'}
      </Text>
      <Text style={styles.routeText} numberOfLines={1} ellipsizeMode="tail">
        {route.waypoints?.[0]?.label || 'Unknown'}
      </Text>
      <Text style={styles.routeText} numberOfLines={1} ellipsizeMode="tail">
        {route.waypoints?.[1]?.label || 'Unknown'}
      </Text>
      <Text style={styles.distance}>{route.distance || '—'}</Text>
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
          <View style={{flex: 1}}>
            <View style={styles.plusBtnRow}>
              <TouchableOpacity
                style={styles.plusBtn}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={true}
              overScrollMode="always"
              nestedScrollEnabled={true}
              contentContainerStyle={{paddingBottom: 100}}>
              {myRoutes.map(route => (
                <View key={route._id || route.id}>
                  {renderRouteCard(route)}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.placeholder}>
            Search for community routes here
          </Text>
        )}
      </View>

      <CreateRouteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateRoute}
      />
    </View>
  );
}
