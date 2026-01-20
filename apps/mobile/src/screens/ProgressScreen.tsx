import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { progressAPI, streakAPI } from '../services/api';

interface ProgressStats {
  total_sessions: number;
  total_time_minutes: number;
  average_time_minutes: number;
  current_streak: number;
  longest_streak: number;
  questions_this_week: number;
  questions_this_month: number;
}

export default function ProgressScreen() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const statsData = await progressAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e97422" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your consistency over time</Text>
        </View>

        {/* Streak Cards */}
        <View style={styles.streakRow}>
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>
            <Text style={styles.streakValue}>{stats?.current_streak || 0}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Ionicons name="trophy" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.streakValue}>{stats?.longest_streak || 0}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={24} color="#10b981" />
              <Text style={styles.statValue}>{stats?.total_sessions || 0}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{stats?.total_time_minutes || 0}</Text>
              <Text style={styles.statLabel}>Total Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="speedometer-outline" size={24} color="#8b5cf6" />
              <Text style={styles.statValue}>{stats?.average_time_minutes?.toFixed(1) || 0}</Text>
              <Text style={styles.statLabel}>Avg. Minutes</Text>
            </View>
          </View>
        </View>

        {/* This Week/Month */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Ionicons name="calendar-outline" size={20} color="#e97422" />
                <Text style={styles.activityTitle}>This Week</Text>
              </View>
              <Text style={styles.activityValue}>{stats?.questions_this_week || 0}</Text>
              <Text style={styles.activityLabel}>questions completed</Text>
            </View>
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Ionicons name="calendar-outline" size={20} color="#e97422" />
                <Text style={styles.activityTitle}>This Month</Text>
              </View>
              <Text style={styles.activityValue}>{stats?.questions_this_month || 0}</Text>
              <Text style={styles.activityLabel}>questions completed</Text>
            </View>
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>💪</Text>
          <View style={styles.motivationContent}>
            <Text style={styles.motivationTitle}>Keep pushing forward!</Text>
            <Text style={styles.motivationText}>
              {stats?.current_streak === 0
                ? 'Start your streak today and build the habit of consistent practice.'
                : stats && stats.current_streak < 7
                ? "Great start! A few more days and you'll build a strong habit."
                : stats && stats.current_streak < 30
                ? 'Amazing consistency! You\'re building a powerful study routine.'
                : 'Incredible dedication! You\'re on the path to success! 🏆'}
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📊 Understanding Your Progress</Text>
          <Text style={styles.tipsText}>
            • Aim for at least 5 questions per day
          </Text>
          <Text style={styles.tipsText}>
            • Consistency beats intensity - daily practice is key
          </Text>
          <Text style={styles.tipsText}>
            • Review your previous answers to improve
          </Text>
          <Text style={styles.tipsText}>
            • Celebrate milestone streaks! 🎉
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070714',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#0f0e2a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  streakIcon: {
    marginBottom: 12,
  },
  fireEmoji: {
    fontSize: 28,
  },
  streakValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6366f1',
    marginTop: 4,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 14,
    color: '#a5b8fc',
    marginLeft: 8,
  },
  activityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  activityLabel: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  motivationCard: {
    backgroundColor: 'rgba(233, 116, 34, 0.1)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 34, 0.3)',
    marginBottom: 24,
  },
  motivationEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    color: '#a5b8fc',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1b4b',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#a5b8fc',
    marginBottom: 4,
  },
});
