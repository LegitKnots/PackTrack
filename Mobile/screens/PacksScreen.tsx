import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreatePackModal from '../components/CreatePackModal';
import { SERVER_URI } from '../config';
import { styles as globalStyles } from '../styles/RoutesScreen.styles';
import { PackDetails } from '../types/Pack'; // adjust path as needed

export default function PacksScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my');
  const [modalVisible, setModalVisible] = useState(false);
  const [myPacks, setMyPacks] = useState<PackDetails[]>([]);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Authentication Error', 'Missing token');

        const res = await fetch(`${SERVER_URI}/api/packs`, {
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

        if (!res.ok) throw new Error(data.message || 'Failed to fetch packs');

        setMyPacks(data);
      } catch (err: any) {
        Alert.alert('Error Fetching Packs', err.message);
      }
    };

    fetchPacks();
  }, []);

  const handleCreatePack = (newPack: PackDetails) => {
    setMyPacks(prev => [...prev, newPack]);
    setModalVisible(false);
  };

  const renderPackCard = (pack: PackDetails) => (
    <TouchableOpacity
      style={globalStyles.routeCard}
      onPress={() => navigation.navigate('PackDetails', { pack })}
    >
      <Text style={globalStyles.packName} numberOfLines={1}>{pack.name || 'Unnamed'}</Text>
      <Text style={globalStyles.packText} numberOfLines={1}>{pack.description || 'No description'}</Text>
      <Text style={globalStyles.packText} numberOfLines={1}>{pack.owner}</Text>
      <Text style={globalStyles.members}>{pack.members.length} members</Text>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.tabs}>
        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab('my')}>
          <Text style={[globalStyles.tabText, activeTab === 'my' && globalStyles.activeTabText]}>My Packs</Text>
          {activeTab === 'my' && <View style={globalStyles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab('find')}>
          <Text style={[globalStyles.tabText, activeTab === 'find' && globalStyles.activeTabText]}>Find Packs</Text>
          {activeTab === 'find' && <View style={globalStyles.underline} />}
        </TouchableOpacity>
      </View>

      <View style={globalStyles.content}>
        {activeTab === 'my' ? (
          <View style={{ flex: 1 }}>
            <View style={globalStyles.plusBtnRow}>
              <TouchableOpacity style={globalStyles.plusBtn} onPress={() => setModalVisible(true)}>
                <Text style={globalStyles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {myPacks.map(pack => (
                <View key={pack.id}>{renderPackCard(pack)}</View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={globalStyles.placeholder}>Search for community packs here</Text>
        )}
      </View>

      <CreatePackModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreatePack}
      />
    </View>
  );
}
